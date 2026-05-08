// Test function — verify functions work at all
exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'ok', message: 'Function works!' })
  };
};
