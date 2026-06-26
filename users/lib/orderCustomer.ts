type CustomerLookup = (id: number) => Promise<boolean>;

export async function resolveCustomerId(
  customerId: unknown,
  customerExists: CustomerLookup
): Promise<number | null> {
  if (customerId === null || customerId === undefined || customerId === '') {
    return null;
  }

  const parsedId = Number(customerId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }

  const exists = await customerExists(parsedId);
  return exists ? parsedId : null;
}
