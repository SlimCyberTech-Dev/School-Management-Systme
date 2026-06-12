import { redirect } from "next/navigation";

/** Legacy route — unlock is integrated on the CBC oversight page. */
export default function HeadteacherCbcUnlockRedirect() {
  redirect("/headteacher/assessment/cbc");
}
