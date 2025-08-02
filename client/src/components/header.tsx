import '@/globals.css'
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '@/context/auth';
import Logged from './logged';
import { userManager } from '@/lib/user';
import { isNotEmpty } from '@/util/util';
import { contractMgr } from '@/game/data_mgr/contract_mgr';
import { ethers } from 'ethers';

export default function Header() {
  const navigate = useNavigate();
  const { login } = useAuth();  // 在这里调用 useAuth
  const haveUser = userManager.size() > 0;

  useEffect(() => {
    const account = localStorage.getItem('account');
    const user = isNotEmpty(account) ? userManager.getUserById(account) : undefined;
    if (user) {
      const wallet = ethers.Wallet.fromPhrase(user.mnemonic)
      login(user, user.mnemonic, wallet)
      
      console.log(wallet.privateKey)
      contractMgr.reload(wallet.privateKey)
      navigate('/room_list');
      return
    }

    navigate("/login");
  }, []);

  // bg-gray-400
  return (
    <header className="px-2 py-2 text-[var(--text)] bg-transparent">
      <div className="flex justify-end items-center">
        {/* 右侧 */}
        <div>
          {haveUser ? (
            <Logged />
          ) : (
            <Link to="/login">
              <span className="cursor-pointer hover:text-indigo-300">登录</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
