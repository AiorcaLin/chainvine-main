// Client formatting tool
import { ethers } from 'ethers';

export function formatEtherBalance(balance: string): string {
  try {
    const formatted = ethers.formatEther(balance);
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0
    }).format(parseFloat(formatted));
  } catch (error) {
    console.error('Error formatting ether balance:', error);
    return '0';
  }
}

export function formatSupply(supply: string, decimals: number = 18): string {
  try {
    const formatted = ethers.formatUnits(supply, decimals);
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(parseFloat(formatted));
  } catch (error) {
    console.error('Error formatting supply:', error);
    return '0';
  }
} 