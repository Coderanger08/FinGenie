import { redirect } from 'next/navigation';

// Explicitly type params and searchParams, even if not used
export default function HomePage({
  params,
  searchParams,
}: {
  params: { [key: string]: string | string[] | undefined };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  redirect('/dashboard');
  return null; // redirect() throws an error, so this won't be reached
}
