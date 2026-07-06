import { AppStateProvider } from './state/appState';

function PreviewShell() {
  return (
    <main className="min-h-screen bg-[#f7f1ff] p-8 text-[#25183f]">
      <h1 className="text-3xl font-bold">Director's Activities App</h1>
      <p className="mt-2 text-sm text-[#6b5c83]">Local preview foundation is ready.</p>
    </main>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <PreviewShell />
    </AppStateProvider>
  );
}
