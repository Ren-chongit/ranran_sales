import React, { useState, useEffect } from 'react';

interface SimpleAuthProps {
  children: React.ReactNode;
}

const SimpleAuth: React.FC<SimpleAuthProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // セッションストレージから認証状態を復元
    const auth = sessionStorage.getItem('sales-app-auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 簡易パスワード認証（実際の環境では環境変数から取得）
    const correctPassword = import.meta.env.VITE_APP_PASSWORD || 'sales2025';
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('sales-app-auth', 'true');
      setError('');
    } else {
      setError('パスワードが正しくありません');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('sales-app-auth');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-custom mx-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            売上管理システム
          </h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2 ml-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ml-2"
                placeholder="パスワードを入力"
                required
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors ml-2"
            >
              ログイン
            </button>
          </form>
          <p className="text-gray-500 text-xs mt-4 text-center">
            アクセス権限をお持ちの方のみご利用いただけます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
        >
          ログアウト
        </button>
      </div>
      {children}
    </div>
  );
};

export default SimpleAuth;