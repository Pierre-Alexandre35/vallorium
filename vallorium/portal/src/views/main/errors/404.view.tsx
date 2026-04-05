import { Link } from 'react-router-dom';
import { paths } from 'src/routes/paths';

export function View404() {
  return (
    <>
      <h3>Sorry, Page Not Found!</h3>

      <p>
        Sorry, we couldn’t find the page you’re looking for. Perhaps you’ve
        mistyped the URL? Be sure to check your spelling.
      </p>

      <Link to={paths.systems.root}>Go to Home</Link>
    </>
  );
}
