import { createFileRoute } from '@tanstack/react-router';
import { NormalLayout } from '@/components/layout/NormalLayout';

export const Route = createFileRoute('/_app')({
  component: NormalLayout,
});

