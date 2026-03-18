import PhotoEditor from "@/components/PhotoEditor";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <div className="dark">
      <QueryClientProvider client={queryClient}>
        <PhotoEditor />
        <Toaster theme="dark" richColors />
      </QueryClientProvider>
    </div>
  );
}
