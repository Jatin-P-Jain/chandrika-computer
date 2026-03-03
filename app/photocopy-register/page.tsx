import { getPhotocopyReadings } from "../daily-accounts/readings-actions";
import { PhotocopyRegisterClient } from "./photocopy-register-client";

export default async function Page() {
  const { data } = await getPhotocopyReadings();

  return <PhotocopyRegisterClient data={data} />;
}
