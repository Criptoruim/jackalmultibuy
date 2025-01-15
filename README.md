# 🗄️ Jackal Multi-Buy Storage Tool

> A web application that allows users to purchase storage on the Jackal Protocol for multiple wallet addresses in a single session. Built with React, TypeScript, and Jackal.js.

## ✨ Features

* 📦 Purchase storage for multiple Jackal wallet addresses simultaneously
* 📄 Upload wallet addresses from a text file (one address per line)
* 💾 Support for both GB and TB storage units
* ⏱️ Flexible duration selection (months or years)
* 🎯 Pre-filled referral code system
* 📊 Real-time transaction status updates
* 🔍 Individual success/failure tracking for each wallet
* 🎨 Modern, user-friendly interface

## 🚀 Prerequisites

* ✅ Node.js (v16 or higher)
* ✅ npm or yarn
* ✅ A Keplr wallet with JKL tokens
* ✅ Chrome browser with Keplr extension installed

## 💻 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Criptoruim/jackalmultibuy.git
   cd jackalmultibuy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

> The application will be available at `http://localhost:5173`

## 📝 Usage

1. **Connect your Keplr wallet** using the "Connect Wallet" button
2. **Enter the storage details:**
   * Amount of storage (GB or TB)
   * Duration (months or years)
3. **Add wallet addresses** either:
   * Manually using the "Add Wallet" button
   * By uploading a text file with addresses (one per line)
4. **Verify or modify** the pre-filled referral code (default: 'criptoruim')
5. **Click "Purchase"** to initiate the transactions
6. **Monitor** the status for each wallet address

### 📋 Bulk Upload Format

When uploading wallet addresses via text file, ensure:
* ✅ One wallet address per line
* ✅ No empty lines
* ✅ Each address starts with 'jkl1'

**Example:**
```plaintext
jkl1wallet1address...
jkl1wallet2address...
jkl1wallet3address...
```

## ⚠️ Error Handling

The application provides detailed feedback for:
* ❌ Invalid wallet addresses
* ❌ Failed transactions
* ❌ Insufficient funds
* ❌ Network issues
* ✅ Individual transaction status

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

## 🙏 Acknowledgments

* 🏗️ Built using the Jackal Protocol
* ⚡ Powered by Jackal.js library
* 🎨 Interface designed with TailwindCSS

## 📄 License

MIT License

Copyright (c) 2025 Criptoruim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.