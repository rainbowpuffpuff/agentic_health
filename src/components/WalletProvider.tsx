
"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { setupWalletSelector, WalletSelector } from "@near-wallet-selector/core";
import { setupModal, WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupBitteWallet } from "@near-wallet-selector/bitte-wallet";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { CONTRACT_ID } from "@/lib/constants";
import React from "react";
import { AccountState } from "@near-wallet-selector/core/lib/store.types";

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}
interface WalletProviderProps {
  children: ReactNode;
}

interface WalletContextValue {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accounts: Array<AccountState>;
  signedAccountId: string | null;
  isLoggingIn: boolean;
  logOut: () => Promise<void>;
  logIn: () => void;
}

const WalletContext = React.createContext<WalletContextValue>({
  selector: null,
  modal: null,
  accounts: [],
  signedAccountId: null,
  isLoggingIn: false,
  logOut: async () => {},
  logIn: () => {},
});

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const init = useCallback(async () => {
    const _selector = await setupWalletSelector({
      network: "mainnet",
      debug: true,
      modules: [
        setupMyNearWallet(),
        setupBitteWallet(),
        setupMeteorWallet(),
        setupLedger(),
        setupNightly(),
      ],
    });
    const _modal = setupModal(_selector, {
      contractId: CONTRACT_ID,
    });
    const state = _selector.store.getState();
    setAccounts(state.accounts);

    window.selector = _selector;
    window.modal = _modal;

    setSelector(_selector);
    setModal(_modal);
  }, []);

  useEffect(() => {
    init().catch((err) => {
      console.error(err);
      alert("Failed to initialise wallet selector");
    });
  }, [init]);

  useEffect(() => {
    if (!selector) {
      return;
    }

    const subscription = selector.store.observable
      .subscribe((state) => {
        setAccounts(state.accounts)
      });
      
    return () => subscription.unsubscribe();
  }, [selector]);

  const logOut = async () => {
    if (!selector) return;
    setIsLoggingIn(true);
    try {
        const wallet = await selector.wallet();
        if(wallet) {
          await wallet.signOut();
        }
    } finally {
        setIsLoggingIn(false);
    }
  };

  const logIn = () => {
    if(modal) {
        modal.show();
    }
  };
  
  const signedAccountId = accounts.find((account) => account.active)?.accountId || null;

  return (
    <WalletContext.Provider value={{
      selector,
      modal,
      accounts,
      signedAccountId,
      isLoggingIn,
      logOut,
      logIn,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export function useWalletSelector() {
  const context = React.useContext(WalletContext);

  if (!context) {
    throw new Error(
      "useWalletSelector must be used within a WalletProvider"
    );
  }

  return context;
}
