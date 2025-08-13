export async function generateStaticParams() {
  return [{ id: "uhealth" }, { id: "demo" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
