import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useSearchParams,
} from 'react-router-dom';

import { useCatalog } from '../catalog/useCatalog';
import CatalogCard from '../components/CatalogCard';
import Navbar from '../components/Navbar';

import '../styles/variables.css';
import './Search.css';

function normalize(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    );
}

export default function Search() {
  const [
    params,
    setParams,
  ] = useSearchParams();

  const {
    items,
    isLoading,
    error,
    reload,
  } = useCatalog();

  const [query, setQuery] =
    useState(
      params.get('q') ?? '',
    );

  const [category, setCategory] =
    useState(
      params.get('cat') ?? '',
    );

  useEffect(() => {
    setQuery(
      params.get('q') ?? '',
    );

    setCategory(
      params.get('cat') ?? '',
    );
  }, [params]);

  const categories =
    useMemo(
      () =>
        Array.from(
          new Set(
            items.map(
              (item) =>
                item.category,
            ),
          ),
        ).sort(
          (left, right) =>
            left.localeCompare(
              right,
              'es',
            ),
        ),
      [items],
    );

  const results =
    useMemo(
      () => {
        const normalizedQuery =
          normalize(query);

        const normalizedCategory =
          normalize(category);

        return items.filter(
          (item) => {
            const searchable = [
              item.resourceName,
              item.businessName,
              item.category,
              item.address,
              item.description,
            ]
              .map(normalize)
              .join(' ');

            const matchesText =
              !normalizedQuery ||
              searchable.includes(
                normalizedQuery,
              );

            const matchesCategory =
              !normalizedCategory ||
              normalize(
                item.category,
              ) ===
                normalizedCategory;

            return (
              matchesText &&
              matchesCategory
            );
          },
        );
      },
      [
        items,
        query,
        category,
      ],
    );

  const updateQuery = (
    value: string,
  ) => {
    setQuery(value);

    const next =
      new URLSearchParams(params);

    if (value.trim()) {
      next.set('q', value);
    } else {
      next.delete('q');
    }

    setParams(
      next,
      {
        replace: true,
      },
    );
  };

  const selectCategory = (
    value: string,
  ) => {
    setCategory(value);

    const next =
      new URLSearchParams(params);

    if (value) {
      next.set('cat', value);
    } else {
      next.delete('cat');
    }

    setParams(
      next,
      {
        replace: true,
      },
    );
  };

  return (
    <div className="se">
      <Navbar active="Servicios" />

      <main className="se__container">
        <header className="se__header">
          <h1>Buscar servicios</h1>

          <p>
            Consulta recursos publicados por
            negocios registrados.
          </p>
        </header>

        <div className="se__searchbar">
          <span
            className="se__search-icon"
            aria-hidden="true"
          >
            ⌕
          </span>

          <input
            type="search"
            className="se__search-input"
            value={query}
            onChange={(event) =>
              updateQuery(
                event.target.value,
              )
            }
            placeholder="Servicio, negocio, categoría o dirección"
            autoFocus
          />

          {query && (
            <button
              type="button"
              className="se__clear"
              onClick={() =>
                updateQuery('')
              }
              aria-label="Limpiar búsqueda"
            >
              Limpiar
            </button>
          )}
        </div>

        {!isLoading &&
          !error &&
          categories.length > 0 && (
            <div
              className="se__filters"
              aria-label="Filtros por categoría"
            >
              <button
                type="button"
                className={
                  `se__filter ${
                    !category
                      ? 'se__filter--primary'
                      : ''
                  }`
                }
                onClick={() =>
                  selectCategory('')
                }
              >
                Todas
              </button>

              {categories.map(
                (itemCategory) => (
                  <button
                    type="button"
                    key={itemCategory}
                    className={
                      `se__filter ${
                        category ===
                        itemCategory
                          ? 'se__filter--primary'
                          : ''
                      }`
                    }
                    onClick={() =>
                      selectCategory(
                        itemCategory,
                      )
                    }
                  >
                    {itemCategory}
                  </button>
                ),
              )}
            </div>
          )}

        {isLoading && (
          <section
            className="se__state"
            role="status"
          >
            <span className="se__spinner" />
            <p>Cargando resultados…</p>
          </section>
        )}

        {!isLoading && error && (
          <section
            className="se__state se__state--error"
            role="alert"
          >
            <h2>
              No pudimos consultar el catálogo
            </h2>

            <p>{error}</p>

            <button
              type="button"
              className="se__retry"
              onClick={() =>
                void reload()
              }
            >
              Reintentar
            </button>
          </section>
        )}

        {!isLoading &&
          !error && (
            <section>
              <div className="se__results-head">
                <h2 className="se__section-title">
                  Resultados
                </h2>

                <span>
                  {results.length}
                  {' '}
                  {results.length === 1
                    ? 'servicio'
                    : 'servicios'}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="se__empty">
                  <h3>
                    Aún no hay servicios publicados
                  </h3>

                  <p>
                    Actualiza la página cuando un
                    negocio haya creado recursos.
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div className="se__empty">
                  <h3>
                    No encontramos coincidencias
                  </h3>

                  <p>
                    Prueba otra palabra o elimina
                    el filtro seleccionado.
                  </p>
                </div>
              ) : (
                <div className="se__results">
                  {results.map(
                    (item) => (
                      <CatalogCard
                        key={item.resourceId}
                        item={item}
                        variant="list"
                      />
                    ),
                  )}
                </div>
              )}
            </section>
          )}
      </main>

      <footer className="se__footer">
        reservapp.com/buscar
      </footer>
    </div>
  );
}
