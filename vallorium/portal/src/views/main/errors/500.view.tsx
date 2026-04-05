import { Link } from 'react-router-dom';
import { paths } from 'src/routes/paths';

export function View500() {
  return (
    <>
      <h3>500 Internal Server Error</h3>

      <p>There was an error, please try again later.</p>

      <Link to={paths.systems.root}>Go to Home</Link>
    </>
  );
}
