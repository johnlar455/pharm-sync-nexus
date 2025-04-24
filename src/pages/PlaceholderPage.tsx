
import { ReactNode } from 'react';

type PlaceholderPageProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

export default function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border bg-card p-8 text-center">
        <div className="rounded-full bg-pharmacy-100 p-4 text-pharmacy-600">
          {icon}
        </div>
        <h2 className="mt-6 text-2xl font-semibold">Coming Soon</h2>
        <p className="mt-2 max-w-md text-center text-muted-foreground">
          This feature is under development and will be available in the next update of PharmSync.
        </p>
      </div>
    </div>
  );
}
