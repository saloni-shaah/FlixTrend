export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startViewProcessor } = await import('./lib/viewProcessor');
    const { viewQueue } = await import('./app/api/view/route');
    startViewProcessor(viewQueue);
  }
}