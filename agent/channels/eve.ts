import { none } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

export default eveChannel({
  // Mr. Reconcile is an intentionally public demo.
  auth: none(),
});
