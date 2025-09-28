/**
 * React hook for ZK-Email SDK integration
 * 
 * Provides state management and utilities for:
 * - SDK initialization
 * - Proof generation progress
 * - Error handling
 * - Campaign management
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getZKEmailProver, 
  generateCivicEngagementProof, 
  verifyCivicEngagementProof,
  type CivicProof,
  type Campaign 
} from '@/lib/zk-email';

export interface ZKEmailState {
  isInitialized: boolean;
  isInitializing: boolean;
  isGeneratingProof: boolean;
  isVerifyingProof: boolean;
  error: string | null;
  lastProof: CivicProof | null;
}

export interface ZKEmailActions {
  initializeSDK: () => Promise<void>;
  generateProof: (emlContent: string, campaign: Campaign) => Promise<CivicProof | null>;
  verifyProof: (proof: CivicProof) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing ZK-Email SDK state and operations
 */
export function useZKEmail(): ZKEmailState & ZKEmailActions {
  const [state, setState] = useState<ZKEmailState>({
    isInitialized: false,
    isInitializing: false,
    isGeneratingProof: false,
    isVerifyingProof: false,
    error: null,
    lastProof: null,
  });

  /**
   * Initialize the ZK-Email SDK
   */
  const initializeSDK = useCallback(async () => {
    if (state.isInitialized || state.isInitializing) {
      return;
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      await getZKEmailProver();
      setState(prev => ({ 
        ...prev, 
        isInitialized: true, 
        isInitializing: false 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize ZK-Email SDK';
      setState(prev => ({ 
        ...prev, 
        isInitializing: false, 
        error: errorMessage 
      }));
    }
  }, [state.isInitialized, state.isInitializing]);

  /**
   * Generate a civic engagement proof
   */
  const generateProof = useCallback(async (
    emlContent: string, 
    campaign: Campaign
  ): Promise<CivicProof | null> => {
    if (!state.isInitialized) {
      setState(prev => ({ ...prev, error: 'SDK not initialized' }));
      return null;
    }

    setState(prev => ({ ...prev, isGeneratingProof: true, error: null }));

    try {
      const proof = await generateCivicEngagementProof(emlContent, campaign);
      setState(prev => ({ 
        ...prev, 
        isGeneratingProof: false, 
        lastProof: proof 
      }));
      return proof;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate proof';
      setState(prev => ({ 
        ...prev, 
        isGeneratingProof: false, 
        error: errorMessage 
      }));
      return null;
    }
  }, [state.isInitialized]);

  /**
   * Verify a civic engagement proof
   */
  const verifyProof = useCallback(async (proof: CivicProof): Promise<boolean> => {
    if (!state.isInitialized) {
      setState(prev => ({ ...prev, error: 'SDK not initialized' }));
      return false;
    }

    setState(prev => ({ ...prev, isVerifyingProof: true, error: null }));

    try {
      const isValid = await verifyCivicEngagementProof(proof);
      setState(prev => ({ ...prev, isVerifyingProof: false }));
      return isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify proof';
      setState(prev => ({ 
        ...prev, 
        isVerifyingProof: false, 
        error: errorMessage 
      }));
      return false;
    }
  }, [state.isInitialized]);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setState({
      isInitialized: false,
      isInitializing: false,
      isGeneratingProof: false,
      isVerifyingProof: false,
      error: null,
      lastProof: null,
    });
  }, []);

  /**
   * Auto-initialize SDK on mount if enabled
   */
  useEffect(() => {
    const zkEmailEnabled = process.env.NEXT_PUBLIC_ZK_EMAIL_ENABLED === 'true';
    
    if (zkEmailEnabled && !state.isInitialized && !state.isInitializing) {
      initializeSDK();
    }
  }, [initializeSDK, state.isInitialized, state.isInitializing]);

  return {
    ...state,
    initializeSDK,
    generateProof,
    verifyProof,
    clearError,
    reset,
  };
}

/**
 * Hook for managing email file uploads
 */
export function useEmailUpload() {
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    uploadedFile: null as File | null,
    emlContent: '',
    error: null as string | null,
  });

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith('.eml')) {
      setUploadState(prev => ({ 
        ...prev, 
        error: 'Please upload a .eml file' 
      }));
      return;
    }

    setUploadState(prev => ({ 
      ...prev, 
      isUploading: true, 
      error: null 
    }));

    try {
      const content = await file.text();
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadedFile: file,
        emlContent: content,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to read file';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const clearUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      uploadedFile: null,
      emlContent: '',
      error: null,
    });
  }, []);

  return {
    ...uploadState,
    handleFileUpload,
    clearUpload,
  };
}