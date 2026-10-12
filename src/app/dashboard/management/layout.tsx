import React from 'react';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Management
        </h1>
        <p className="text-muted-foreground">
          Create, edit, and manage all entities in your racing universe.
        </p>
      </div>
      {children}
    </div>
  );
}
