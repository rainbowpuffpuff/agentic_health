export function useWalletBalance() {
  const { accountId, selector } = useWalletSelector();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (account: string) => {
    if (!selector) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { network } = selector.options;
      const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });
      const accountData = await provider.query({
        request_type: "view_account",
        finality: "final",
        account_id: account
      });
      
      // @ts-ignore - NEAR RPC response type
      const balanceYocto = accountData.amount;
      const balanceFormatted = utils.format.formatNearAmount(balanceYocto, 6);
      setBalance(balanceFormatted);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet balance');
    } finally {
      setIsLoading(false);
    }
  }, [selector]);

  useEffect(() => {
    if (accountId) {
      fetchBalance(accountId);
    }
  }, [accountId, fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refetch: accountId ? () => fetchBalance(accountId) : undefined
  };
}