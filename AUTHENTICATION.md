# 🔐 Authentication Methods in Account Kit

This project already implements **ALL major authentication methods** using Alchemy Signer!

## ✅ Currently Implemented

### **Alchemy Signer (Embedded Wallets)**
All these methods use Alchemy Signer under the hood and create **Smart Accounts** with gas sponsorship:

1. **📧 Email Authentication**
   - Email OTP (One-Time Password)
   - Email Magic Link
   - ✅ Gas-free transactions
   - ✅ Smart account features

2. **🔑 Passkey Authentication**
   - Biometric login (Face ID, Touch ID, Windows Hello)
   - Hardware security keys
   - ✅ Gas-free transactions
   - ✅ Smart account features

3. **🌐 Social Login**
   - Google
   - Facebook
   - Apple (available)
   - Discord (available)
   - GitHub (available)
   - Twitter (available)
   - ✅ Gas-free transactions
   - ✅ Smart account features

4. **👛 External Wallets**
   - MetaMask, Coinbase Wallet, etc.
   - WalletConnect support
   - ✅ EIP-7702 Smart EOA features (gas sponsorship, batching)
   - ✅ Maintains original EOA address

## 🚀 Additional Features Available

### **EIP-7702 Smart EOAs** ⚡
Convert EOAs to have smart account features while keeping the same address:

**What EIP-7702 Does:**
- 🎯 **Keeps your EOA address** - No need for a new wallet address
- ⚡ **Adds smart features** - Gas sponsorship, batch transactions, custom logic
- 🔄 **Reversible** - Can enable/disable smart features as needed
- 🛡️ **Non-custodial** - You still control your private keys

**Already Enabled in your config:**
```typescript
sessionConfig: {
  eip7702: {
    enable: true, // ✅ Active
  },
},
```

**How it works:**
1. Connect with external wallet (MetaMask, etc.)
2. EIP-7702 delegates your EOA to smart contract code
3. Your EOA gains smart account capabilities
4. Enjoy gas-free transactions while keeping your address!

### **Additional Social Providers**
Uncomment in config.ts to enable:
- Apple
- Discord  
- GitHub
- Twitter

### **Custom Social Providers (Auth0)**
For enterprise custom OAuth providers, see [Custom Social Providers docs](https://www.alchemy.com/docs/wallets/react/login-methods/social-providers).

## 🎯 Key Concepts

- **Alchemy Signer** = The infrastructure powering email, passkey, and social logins
- **Smart Accounts** = Accounts with gas sponsorship and programmable features
- **EOAs** = Traditional Ethereum accounts (external wallets like MetaMask)
- **Account Abstraction** = Smart accounts, not available for external wallets in Account Kit

## 🔧 Configuration

Your authentication is configured in `config.ts`:

```typescript
const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [
      [{ type: "email" }],                    // Alchemy Signer
      [{ type: "passkey" }],                  // Alchemy Signer  
      [{ type: "social", authProviderId: "google" }], // Alchemy Signer
      [{ type: "external_wallets" }],         // EOAs
    ],
    addPasskeyOnSignup: false, // Set to true for auto-passkey prompt
  },
};
```

## 📱 User Experience

- **Email/Social/Passkey** → Smart Account → Gas-free minting ✅
- **External Wallets** → EOA → User pays gas fees ✅
- **Both types** → Full UI support with appropriate messaging ✅

## 🏗️ What's NOT Available

Account Kit does **not** support:
- Converting external wallets to smart accounts
- Custom signer implementations in the UI components
- Direct Alchemy Signer API access in React components

For custom implementations, use the `@account-kit/signer` package directly.
