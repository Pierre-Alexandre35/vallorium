import { Helmet } from 'react-helmet-async';
import { View403 } from 'src/views/main/errors';

export function Page403() {
  return (
    <>
      <Helmet>
        <title> 403 Forbidden</title>
      </Helmet>

      <View403 />
    </>
  );
}
