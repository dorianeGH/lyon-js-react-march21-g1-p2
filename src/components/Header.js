import { NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header>
      <nav>
        <ul>
          <li>
            <NavLink exact to="/" id="logo">
              U pizz'
            </NavLink>
          </li>
          <li>
            <NavLink exact to="/pizzaperso" className="menuItems">
              Commander
            </NavLink>
          </li>
          <li>
            <NavLink exact to="/login" className="menuItems">
              Login
            </NavLink>
          </li>
          <li>
            <NavLink exact to="/contact" className="menuItems">
              Contact/About
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
