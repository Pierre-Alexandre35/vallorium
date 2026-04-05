import { Link } from 'react-router-dom';
import { paths } from 'src/routes/paths';

export function View403() {
  return (
    <>
      <h3>No permission</h3>

      <p>
        The page you&apos;re trying access has restricted access.
        <br />
        Please refer to your system administrator
      </p>

      <Link to={paths.systems.root}>Go to Home</Link>
    </>
  );
}
