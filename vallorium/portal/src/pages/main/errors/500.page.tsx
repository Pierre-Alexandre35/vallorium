import { Helmet } from 'react-helmet-async';
import { View500 } from 'src/views/main/errors';

export function Page500() {
  return (
    <>
      <Helmet>
        <title> 500 Internal Server Error</title>
      </Helmet>

      <View500 />
    </>
  );
}
