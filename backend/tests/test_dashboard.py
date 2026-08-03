"""
Pruebas del panel administrativo y del reporte PDF.

Cubren tres cosas: que el control de acceso funcione, que las metricas
calculen bien, y que un negocio no pueda ver datos de otro.
"""


def _crear_reserva(client, headers, resource_id, inicio, fin):
    return client.post(
        "/api/reservations/",
        json={
            "resource_id": resource_id,
            "start_time": inicio,
            "end_time": fin,
        },
        headers=headers,
    )


def test_dashboard_requiere_autenticacion(client):
    """Sin token no se entra al panel."""
    respuesta = client.get("/api/dashboard/summary")
    assert respuesta.status_code == 401


def test_dashboard_rechaza_clientes(client, auth_headers):
    """Un cliente normal no tiene panel administrativo."""
    respuesta = client.get("/api/dashboard/summary", headers=auth_headers)
    assert respuesta.status_code == 403


def test_dashboard_permite_propietario(client, owner_headers):
    """Un propietario de negocio si entra, aunque no tenga datos todavia."""
    respuesta = client.get("/api/dashboard/summary", headers=owner_headers)
    assert respuesta.status_code == 200

    cuerpo = respuesta.json()
    assert cuerpo["alcance"] == "negocio"
    assert cuerpo["indicadores"]["reservas_totales"] == 0
    assert cuerpo["reservas_por_dia"]  # la serie se rellena con ceros


def test_dashboard_cuenta_reservas(client, owner_headers, business_with_data):
    """Una reserva creada debe reflejarse en los indicadores."""
    recurso = business_with_data["resource"]

    creada = _crear_reserva(
        client,
        owner_headers,
        recurso["id"],
        "2030-06-01T10:00:00+00:00",
        "2030-06-01T12:00:00+00:00",
    )
    assert creada.status_code == 201

    cuerpo = client.get(
        "/api/dashboard/summary", headers=owner_headers
    ).json()

    assert cuerpo["indicadores"]["reservas_totales"] == 1
    assert cuerpo["indicadores"]["reservas_activas"] == 1
    assert cuerpo["indicadores"]["reservas_proximas"] == 1
    # 2 horas por 100 de precio por hora
    assert float(cuerpo["indicadores"]["ingreso_estimado"]) == 200.0
    assert cuerpo["recursos_top"][0]["recurso"] == "Recurso Prueba"


def test_reserva_cancelada_no_suma_ingreso(
    client, owner_headers, business_with_data
):
    """Cancelar una reserva la saca de los ingresos y de las activas."""
    recurso = business_with_data["resource"]

    creada = _crear_reserva(
        client,
        owner_headers,
        recurso["id"],
        "2030-07-01T10:00:00+00:00",
        "2030-07-01T12:00:00+00:00",
    )
    reserva_id = creada.json()["id"]

    client.delete(f"/api/reservations/{reserva_id}", headers=owner_headers)

    cuerpo = client.get(
        "/api/dashboard/summary", headers=owner_headers
    ).json()

    assert cuerpo["indicadores"]["reservas_totales"] == 1
    assert cuerpo["indicadores"]["reservas_activas"] == 0
    assert float(cuerpo["indicadores"]["ingreso_estimado"]) == 0.0


def test_propietario_no_ve_datos_de_otro_negocio(
    client, owner_headers, business_with_data, register_user
):
    """
    Aislamiento entre negocios: es la prueba mas importante del control
    de acceso. Un segundo propietario no debe ver nada del primero.
    """
    recurso = business_with_data["resource"]
    _crear_reserva(
        client,
        owner_headers,
        recurso["id"],
        "2030-08-01T10:00:00+00:00",
        "2030-08-01T12:00:00+00:00",
    )

    register_user(
        email="otro@example.com",
        password="Password123",
        full_name="Otro Dueno",
        role="business_owner",
    )
    token = client.post(
        "/api/auth/login",
        data={"username": "otro@example.com", "password": "Password123"},
    ).json()["access_token"]
    otros_headers = {"Authorization": f"Bearer {token}"}

    cuerpo = client.get(
        "/api/dashboard/summary", headers=otros_headers
    ).json()

    assert cuerpo["indicadores"]["reservas_totales"] == 0


def test_parametro_dias_se_valida(client, owner_headers):
    """El rango permitido es de 1 a 365 dias."""
    assert client.get(
        "/api/dashboard/summary?dias=0", headers=owner_headers
    ).status_code == 422
    assert client.get(
        "/api/dashboard/summary?dias=400", headers=owner_headers
    ).status_code == 422
    assert client.get(
        "/api/dashboard/summary?dias=7", headers=owner_headers
    ).status_code == 200


def test_pdf_se_genera_correctamente(
    client, owner_headers, business_with_data
):
    """El endpoint devuelve un PDF real, no un JSON con error."""
    recurso = business_with_data["resource"]
    _crear_reserva(
        client,
        owner_headers,
        recurso["id"],
        "2030-09-01T10:00:00+00:00",
        "2030-09-01T12:00:00+00:00",
    )

    respuesta = client.get("/api/dashboard/report.pdf", headers=owner_headers)

    assert respuesta.status_code == 200
    assert respuesta.headers["content-type"] == "application/pdf"
    assert "attachment" in respuesta.headers["content-disposition"]
    # Todo PDF valido empieza con esta firma
    assert respuesta.content.startswith(b"%PDF")
    assert len(respuesta.content) > 1000


def test_pdf_sin_datos_no_truena(client, owner_headers):
    """
    Caso limite: un negocio recien creado, sin ninguna reserva.
    La grafica de barras con puros ceros rompia ReportLab si el eje no
    se acotaba manualmente.
    """
    respuesta = client.get("/api/dashboard/report.pdf", headers=owner_headers)
    assert respuesta.status_code == 200
    assert respuesta.content.startswith(b"%PDF")


def test_pdf_rechaza_clientes(client, auth_headers):
    """El reporte tiene el mismo control de acceso que el panel."""
    respuesta = client.get("/api/dashboard/report.pdf", headers=auth_headers)
    assert respuesta.status_code == 403


def test_completed_cuenta_ingreso_pero_no_activa(
    client, owner_headers, business_with_data, db_session
):
    """
    Una reserva 'completed' ya ocurrio: genera ingreso pero no cuenta como
    activa. No hay endpoint para completar, asi que se marca el estado
    directo en la BD (estado sintetico, solo para la prueba).
    """
    from app.models.reservation import Reservation

    recurso = business_with_data["resource"]
    creada = _crear_reserva(
        client,
        owner_headers,
        recurso["id"],
        "2030-06-01T10:00:00+00:00",
        "2030-06-01T12:00:00+00:00",
    )
    reserva_id = creada.json()["id"]

    reserva = db_session.get(Reservation, reserva_id)
    reserva.status = "completed"
    db_session.commit()

    ind = client.get(
        "/api/dashboard/summary", headers=owner_headers
    ).json()["indicadores"]

    assert ind["reservas_totales"] == 1
    assert ind["reservas_activas"] == 0              # completed no es activa
    assert float(ind["ingreso_estimado"]) == 200.0   # pero si genera ingreso
    assert float(ind["ingreso_promedio"]) == 200.0   # promedio sobre 1 con ingreso


def test_cancelada_no_entra_en_promedio(
    client, owner_headers, business_with_data
):
    """
    El ingreso promedio se divide solo entre las reservas que generan ingreso.
    Una cancelada no debe bajar el promedio.
    """
    recurso = business_with_data["resource"]

    # Activa: 2h * 100 = 200 de ingreso.
    _crear_reserva(
        client,
        owner_headers,
        recurso["id"],
        "2030-06-01T10:00:00+00:00",
        "2030-06-01T12:00:00+00:00",
    )
    # Segunda reserva, en otro dia, que luego cancelamos.
    creada = _crear_reserva(
        client,
        owner_headers,
        recurso["id"],
        "2030-06-02T10:00:00+00:00",
        "2030-06-02T12:00:00+00:00",
    )
    client.delete(
        f"/api/reservations/{creada.json()['id']}", headers=owner_headers
    )

    ind = client.get(
        "/api/dashboard/summary", headers=owner_headers
    ).json()["indicadores"]

    assert ind["reservas_totales"] == 2
    assert float(ind["ingreso_estimado"]) == 200.0
    # Se divide entre 1 (la que genera ingreso), no entre 2.
    assert float(ind["ingreso_promedio"]) == 200.0


def test_promedio_cero_sin_reservas_con_ingreso(
    client, owner_headers, business_with_data
):
    """
    Si no queda ninguna reserva con ingreso, el promedio es 0 y no truena
    por division entre cero.
    """
    recurso = business_with_data["resource"]
    creada = _crear_reserva(
        client,
        owner_headers,
        recurso["id"],
        "2030-06-01T10:00:00+00:00",
        "2030-06-01T12:00:00+00:00",
    )
    client.delete(
        f"/api/reservations/{creada.json()['id']}", headers=owner_headers
    )

    ind = client.get(
        "/api/dashboard/summary", headers=owner_headers
    ).json()["indicadores"]

    assert float(ind["ingreso_promedio"]) == 0.0
