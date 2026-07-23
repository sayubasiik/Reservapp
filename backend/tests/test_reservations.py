from datetime import datetime, timedelta, timezone

from app.models.resource import Resource
from tests.conftest import TestingSessionLocal


def create_resource() -> int:
    with TestingSessionLocal() as db:
        resource = Resource(
            name="Cancha 1",
            capacity=10,
            price_per_hour=250,
        )
        db.add(resource)
        db.commit()
        db.refresh(resource)
        return resource.id


def test_reservation_rejects_invalid_time_range(
    client,
    auth_headers,
):
    start = datetime.now(timezone.utc) + timedelta(days=1)

    response = client.post(
        "/api/reservations/",
        headers=auth_headers,
        json={
            "resource_id": create_resource(),
            "start_time": start.isoformat(),
            "end_time": start.isoformat(),
        },
    )

    assert response.status_code == 422


def test_reservation_rejects_past_date(client, auth_headers):
    start = datetime.now(timezone.utc) - timedelta(hours=2)

    response = client.post(
        "/api/reservations/",
        headers=auth_headers,
        json={
            "resource_id": create_resource(),
            "start_time": start.isoformat(),
            "end_time": (
                start + timedelta(hours=1)
            ).isoformat(),
        },
    )

    assert response.status_code == 422


def test_reservation_requires_timezone(client, auth_headers):
    start = datetime.now() + timedelta(days=1)

    response = client.post(
        "/api/reservations/",
        headers=auth_headers,
        json={
            "resource_id": create_resource(),
            "start_time": start.isoformat(),
            "end_time": (
                start + timedelta(hours=1)
            ).isoformat(),
        },
    )

    assert response.status_code == 422


def test_overlapping_reservation_returns_conflict(
    client,
    auth_headers,
):
    resource_id = create_resource()
    start = datetime.now(timezone.utc) + timedelta(days=1)

    first = client.post(
        "/api/reservations/",
        headers=auth_headers,
        json={
            "resource_id": resource_id,
            "start_time": start.isoformat(),
            "end_time": (
                start + timedelta(hours=2)
            ).isoformat(),
        },
    )

    overlapping = client.post(
        "/api/reservations/",
        headers=auth_headers,
        json={
            "resource_id": resource_id,
            "start_time": (
                start + timedelta(hours=1)
            ).isoformat(),
            "end_time": (
                start + timedelta(hours=3)
            ).isoformat(),
        },
    )

    assert first.status_code == 201
    assert overlapping.status_code == 409