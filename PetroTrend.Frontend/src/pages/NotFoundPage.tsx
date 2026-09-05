import { Link, useLocation } from 'react-router'
import './NotFoundPage.css'

export function NotFoundPage() {
  const { pathname } = useLocation()

  return (
    <section className="lost">
      <p className="eyebrow">Błąd 404</p>

      <div className="lost__board panel" role="img" aria-label="Wyświetlacz pylonu z kodem 404">
        <span className="lost__digits num" aria-hidden="true">
          404
        </span>
        <span className="lost__unit">PLN / L</span>
      </div>

      <h1>Ta dystrybucja jest nieczynna</h1>
      <p className="lost__text">
        Nie znaleziono strony <code className="num">{pathname}</code>. Sprawdź adres albo wróć na pulpit.
      </p>

      <div className="lost__actions">
        <Link to="/" className="btn btn--primary">
          Pulpit
        </Link>
        <Link to="/notowania" className="btn">
          Notowania
        </Link>
      </div>
    </section>
  )
}
