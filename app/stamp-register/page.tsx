import { getStampReadings } from "../daily-accounts/readings-actions";
import { StampRegisterClient } from "./stamp-register-client";

export default async function Page() {
  const { data } = await getStampReadings();

  return <StampRegisterClient data={data} />;
}
