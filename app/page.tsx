import { getChatGPTUser, chatGPTSignInPath } from "./chatgpt-auth";
import Ledger from "./ledger";
export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <Ledger
      user={
        user
          ? { name: user.fullName || "A tua conta", email: user.email }
          : null
      }
      signIn={chatGPTSignInPath("/")}
    />
  );
}
