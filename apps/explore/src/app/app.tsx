import NxWelcome from "./nx-welcome";
import { playground } from "@playground";
import { Card } from "@shadcn";

export function App() {
  return (
    <div>
      <Card>Testing</Card>

      {playground()}
    </div>
  );
}

export default App;
