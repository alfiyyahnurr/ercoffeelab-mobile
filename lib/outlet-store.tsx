import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Outlet } from '@/types/api';

const OUTLET_STORAGE_KEY = 'selected_outlet_data';

const DEFAULT_OUTLET: Outlet = {
  id: 1,
  name: 'ER Coffee Lab Bandung',
  address: 'Jl. Soekarno Hatta No. 45, Bandung',
  isOpen: true,
};

export interface DeliveryAddress {
  id?: number;
  label: string; // e.g. "Lokasi GPS Terkini", "Rumah", "Kantor"
  addressText: string; // e.g. "Jl. Buahbatu No. 45, Sekejati, Bandung"
  recipientName?: string;
  recipientPhone?: string;
  isGps?: boolean;
  latitude?: number;
  longitude?: number;
}

const ADDRESS_STORAGE_KEY = 'selected_delivery_address';

const DEFAULT_ADDRESS: DeliveryAddress = {
  label: 'Lokasi GPS Terkini',
  addressText: 'Jl. Buahbatu No. 45, Sekejati, Bandung',
  isGps: true,
  latitude: -6.9344,
  longitude: 107.6871,
};

interface OutletContextType {
  selectedOutlet: Outlet;
  setSelectedOutlet: (outlet: Outlet) => Promise<void>;
  isLoadingOutlet: boolean;
  selectedAddress: DeliveryAddress;
  setSelectedAddress: (addr: DeliveryAddress) => Promise<void>;
  userGpsAddress: string;
}

const OutletContext = createContext<OutletContextType>({
  selectedOutlet: DEFAULT_OUTLET,
  setSelectedOutlet: async () => {},
  isLoadingOutlet: false,
  selectedAddress: DEFAULT_ADDRESS,
  setSelectedAddress: async () => {},
  userGpsAddress: 'Lokasi GPS Terkini',
});

export function OutletProvider({ children }: { children: ReactNode }) {
  const [selectedOutlet, setSelectedOutletState] = useState<Outlet>(DEFAULT_OUTLET);
  const [selectedAddress, setSelectedAddressState] = useState<DeliveryAddress>(DEFAULT_ADDRESS);
  const [userGpsAddress, setUserGpsAddress] = useState<string>('Lokasi GPS Terkini');
  const [isLoadingOutlet, setIsLoadingOutlet] = useState(true);

  // Load stored selected outlet and address on app startup
  useEffect(() => {
    async function loadStoredData() {
      try {
        let storedOutletJson: string | null = null;
        let storedAddressJson: string | null = null;

        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined' && window.localStorage) {
            storedOutletJson = window.localStorage.getItem(OUTLET_STORAGE_KEY);
            storedAddressJson = window.localStorage.getItem(ADDRESS_STORAGE_KEY);
          }
        } else {
          storedOutletJson = await SecureStore.getItemAsync(OUTLET_STORAGE_KEY);
          storedAddressJson = await SecureStore.getItemAsync(ADDRESS_STORAGE_KEY);
        }

        if (storedOutletJson) {
          const parsed = JSON.parse(storedOutletJson);
          if (parsed && typeof parsed === 'object' && parsed.id && parsed.name) {
            setSelectedOutletState(parsed);
          }
        }

        if (storedAddressJson) {
          const parsedAddr = JSON.parse(storedAddressJson);
          if (parsedAddr && typeof parsedAddr === 'object' && parsedAddr.addressText) {
            setSelectedAddressState(parsedAddr);
          }
        }
      } catch (err) {
        console.warn('[outlet-store] Error loading stored data:', err);
      } finally {
        setIsLoadingOutlet(false);
      }
    }

    loadStoredData();
  }, []);

  const setSelectedOutlet = async (outlet: Outlet) => {
    setSelectedOutletState(outlet);
    try {
      const jsonStr = JSON.stringify(outlet);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(OUTLET_STORAGE_KEY, jsonStr);
        }
      } else {
        await SecureStore.setItemAsync(OUTLET_STORAGE_KEY, jsonStr);
      }
    } catch (err) {
      console.warn('[outlet-store] Error saving outlet:', err);
    }
  };

  const setSelectedAddress = async (addr: DeliveryAddress) => {
    setSelectedAddressState(addr);
    try {
      const jsonStr = JSON.stringify(addr);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(ADDRESS_STORAGE_KEY, jsonStr);
        }
      } else {
        await SecureStore.setItemAsync(ADDRESS_STORAGE_KEY, jsonStr);
      }
    } catch (err) {
      console.warn('[outlet-store] Error saving address:', err);
    }
  };

  return (
    <OutletContext.Provider
      value={{
        selectedOutlet,
        setSelectedOutlet,
        isLoadingOutlet,
        selectedAddress,
        setSelectedAddress,
        userGpsAddress,
      }}
    >
      {children}
    </OutletContext.Provider>
  );
}

export function useOutlet() {
  return useContext(OutletContext);
}
