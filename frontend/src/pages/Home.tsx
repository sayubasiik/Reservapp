import {
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useCatalog } from '../catalog/useCatalog';
import CatalogCard from '../components/CatalogCard';
import CategoryCard from '../components/CategoryCard';
import Navbar from '../components/Navbar';

import type {
  Category,
  CategoryColor,
} from '../types';

import '../styles/variables.css';
import './Home.css';

const CATEGORY_COLORS:
CategoryColor[] = [
  'blue',
  'pink',
  'amber',
  'green',
  'gray',
];

function categoryId(
  category: string,
): string {
  return category
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .replace(
      /[^a-z0-9]+/g,
      '-',
    )
    .replace(
      /^-|-$/g,
      '',
    );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    items,
    isLoading,
    error,
    reload,
  } = useCatalog();

  const [query, setQuery] =
    useState('');

  const firstName =
    (user?.name ?? 'Usuario')
      .trim()
      .split(/\s+/)[0];

  const categories =
    useMemo<Category[]>(
      () => {
        const names = Array.from(
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
        );

        return names.map(
          (name, index) => ({
            id:
              categoryId(name) ||
              `categoria-${index}`,
            name,
            icon:
              name
                .trim()
                .charAt(0)
                .toUpperCase() ||
              'R',
            color:
              CATEGORY_COLORS[
                index %
                CATEGORY_COLORS.length
              ],
          }),
        );
      },
      [items],
    );

  const featuredItems =
    useMemo(
      () => items.slice(0, 8),
      [items],
    );

  const runSearch = () => {
    const value = query.trim();

    navigate(
      value
        ? `/buscar?q=${encodeURIComponent(
            value,
          )}`
        : '/buscar',
    );
  };

  const openSearch = (
    category = '',
  ) => {
    navigate(
      category
        ? `/buscar?cat=${encodeURIComponent(
            category,
          )}`
        : '/buscar',
    );
  };

  return (
    <div className="home">
      <Navbar active="Inicio" />

      <main className="home__container">
        <section className="home__hero">
          <h1 className="home__greeting">
            Hola, {firstName}
          </h1>

          <p className="home__subtitle">
            Encuentra recursos y servicios
            disponibles para reservar.
          </p>
        </section>

        <form
          className="home__search"
          onSubmit={(event) => {
            event.preventDefault();
            runSearch();
          }}
        >
          <div className="home__search-field">
            <span
              className="home__search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              className="home__search-input"
              placeholder="Buscar servicio, negocio o lugar"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
            />
          </div>

          <button
            type="submit"
            className="home__search-btn"
          >
            Buscar
          </button>
        </form>

        {isLoading && (
          <section
            className="home__state"
            role="status"
          >
            <span className="home__spinner" />
            <p>Cargando catálogo…</p>
          </section>
        )}

        {!isLoading && error && (
          <section
            className="home__state home__state--error"
            role="alert"
          >
            <h2>
              No pudimos cargar el catálogo
            </h2>

            <p>{error}</p>

            <button
              type="button"
              className="home__retry"
              onClick={() =>
                void reload()
              }
            >
              Reintentar
            </button>
          </section>
        )}

        {!isLoading &&
          !error &&
          items.length === 0 && (
            <section className="home__state">
              <h2>
                Aún no hay servicios publicados
              </h2>

              <p>
                Cuando los negocios publiquen
                recursos, aparecerán aquí.
              </p>

              <button
                type="button"
                className="home__retry"
                onClick={() =>
                  void reload()
                }
              >
                Actualizar
              </button>
            </section>
          )}

        {!isLoading &&
          !error &&
          items.length > 0 && (
            <>
              <section className="home__section">
                <div className="home__section-head">
                  <h2 className="home__section-title">
                    Categorías
                  </h2>

                  <button
                    type="button"
                    className="home__link"
                    onClick={() =>
                      openSearch()
                    }
                  >
                    Ver todas
                  </button>
                </div>

                <div className="home__categories">
                  {categories.map(
                    (category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        onClick={() =>
                          openSearch(
                            category.name,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              </section>

              <section className="home__section">
                <div className="home__section-head">
                  <h2 className="home__section-title">
                    Servicios disponibles
                  </h2>

                  <button
                    type="button"
                    className="home__link"
                    onClick={() =>
                      openSearch()
                    }
                  >
                    Ver todos
                  </button>
                </div>

                <div className="home__services">
                  {featuredItems.map(
                    (item) => (
                      <CatalogCard
                        key={item.resourceId}
                        item={item}
                      />
                    ),
                  )}
                </div>
              </section>
            </>
          )}
      </main>

      <footer className="home__footer">
        reservapp.com/inicio
      </footer>
    </div>
  );
}
