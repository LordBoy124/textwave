"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  avatar: string;
  status: string;
};

type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  kind: 'text' | 'image' | 'file';
  fileName?: string;
  attachmentUrl?: string;
};

type Chat = {
  id: string;
  name: string;
  type: 'direct' | 'group';
  memberIds: string[];
  messages: Message[];
  updatedAt: string;
};

const STORAGE_KEYS = {
  USERS: 'textwave_users',
  CHATS: 'textwave_chats',
  CURRENT_USER: 'textwave_current_user',
};

const seedUsers: User[] = [
  {
    id: 'u1',
    name: 'Maya Carter',
    username: 'maya',
    password: 'password',
    avatar: 'MC',
    status: 'Available',
  },
  {
    id: 'u2',
    name: 'Alex King',
    username: 'alex',
    password: 'password',
    avatar: 'AK',
    status: 'In a meeting',
  },
  {
    id: 'u3',
    name: 'Jordan Lee',
    username: 'jordan',
    password: 'password',
    avatar: 'JL',
    status: 'Studying',
  },
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function makeInitialChats(currentUserId: string): Chat[] {
  return [
    {
      id: 'c1',
      name: 'Maya Carter',
      type: 'direct',
      memberIds: [currentUserId, 'u1'],
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'm1',
          senderId: 'u1',
          text: 'Hey! Want to review the group project later?',
          createdAt: new Date().toISOString(),
          kind: 'text',
        },
        {
          id: 'm2',
          senderId: currentUserId,
          text: 'Absolutely. I can join after 6 PM.',
          createdAt: new Date().toISOString(),
          kind: 'text',
        },
      ],
    },
    {
      id: 'c2',
      name: 'Friends Group',
      type: 'group',
      memberIds: [currentUserId, 'u1', 'u2', 'u3'],
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'm3',
          senderId: 'u2',
          text: 'Let’s meet on Saturday for the movie night!',
          createdAt: new Date().toISOString(),
          kind: 'text',
        },
      ],
    },
  ];
}

export default function Page() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [message, setMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);

    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const storedChats = localStorage.getItem(STORAGE_KEYS.CHATS);
    const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }

    if (storedChats) {
      setChats(JSON.parse(storedChats));
    }

    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }, [chats, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser, mounted]);

  useEffect(() => {
    if (!currentUser || chats.length === 0) return;

    if (!selectedChatId && chats[0]) {
      setSelectedChatId(chats[0].id);
    }

    const exists = chats.some((chat) => chat.id === selectedChatId);
    if (selectedChatId && !exists) {
      setSelectedChatId(chats[0]?.id ?? null);
    }
  }, [chats, currentUser, selectedChatId]);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? null;

  const contactList = useMemo(() => {
    return users.filter((user) => user.id !== currentUser?.id);
  }, [currentUser, users]);

  const startNewChat = (otherUserId: string) => {
    if (!currentUser) return;

    const existing = chats.find(
      (chat) =>
        chat.type === 'direct' &&
        chat.memberIds.includes(currentUser.id) &&
        chat.memberIds.includes(otherUserId)
    );

    if (existing) {
      setSelectedChatId(existing.id);
      return;
    }

    const otherUser = users.find((user) => user.id === otherUserId);
    if (!otherUser) return;

    const chat: Chat = {
      id: makeId('chat'),
      name: otherUser.name,
      type: 'direct',
      memberIds: [currentUser.id, otherUser.id],
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: makeId('msg'),
          senderId: otherUser.id,
          text: `Hi ${currentUser.name}! I’m ready to chat.`,
          createdAt: new Date().toISOString(),
          kind: 'text',
        },
      ],
    };

    setChats((prev) => [chat, ...prev]);
    setSelectedChatId(chat.id);
  };

  const handleCreateGroup = (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser || !groupName.trim() || selectedMembers.length === 0) return;

    const memberIds = Array.from(new Set([currentUser.id, ...selectedMembers]));
    const chat: Chat = {
      id: makeId('group'),
      name: groupName.trim(),
      type: 'group',
      memberIds,
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: makeId('msg'),
          senderId: currentUser.id,
          text: `Welcome to ${groupName.trim()}!`,
          createdAt: new Date().toISOString(),
          kind: 'text',
        },
      ],
    };

    setChats((prev) => [chat, ...prev]);
    setSelectedChatId(chat.id);
    setGroupName('');
    setSelectedMembers([]);
  };

  const handleAuthSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (mode === 'signup') {
      if (!form.name.trim() || !form.username.trim() || !form.password.trim()) return;

      const existing = users.find((user) => user.username === form.username.trim());
      if (existing) {
        alert('That username already exists. Please sign in instead.');
        return;
      }

      const newUser: User = {
        id: makeId('user'),
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
        avatar: form.name.trim().split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'NU',
        status: 'Available',
      };

      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      setChats((prev) => (prev.length ? prev : makeInitialChats(newUser.id)));
      setForm({ name: '', username: '', password: '' });
      return;
    }

    const match = users.find(
      (user) => user.username === form.username.trim() && user.password === form.password
    );

    if (!match) {
      alert('Invalid username or password');
      return;
    }

    setCurrentUser(match);
    setChats((prev) => (prev.length ? prev : makeInitialChats(match.id)));
    setForm({ name: '', username: '', password: '' });
  };

  const handleSendMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser || !selectedChat || (!message.trim() && !selectedChat)) return;

    const value = message.trim();
    if (!value) return;

    const newMessage: Message = {
      id: makeId('msg'),
      senderId: currentUser.id,
      text: value,
      createdAt: new Date().toISOString(),
      kind: 'text',
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChat.id
          ? { ...chat, messages: [...chat.messages, newMessage], updatedAt: new Date().toISOString() }
          : chat
      )
    );

    setMessage('');
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!currentUser || !selectedChat || !file) return;

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || '');
      const message: Message = {
        id: makeId('file'),
        senderId: currentUser.id,
        text: isImage ? 'Shared image' : 'Shared file',
        createdAt: new Date().toISOString(),
        kind: isImage ? 'image' : 'file',
        fileName: file.name,
        attachmentUrl: result,
      };

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChat.id
            ? { ...chat, messages: [...chat.messages, message], updatedAt: new Date().toISOString() }
            : chat
        )
      );
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading...</div>;
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-2xl font-bold text-white">
              T
            </div>
            <h1 className="mt-4 text-3xl font-bold">TextWave</h1>
            <p className="mt-2 text-sm text-slate-300">Chat with friends and groups</p>
          </div>

          <div className="mb-6 flex rounded-full bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-full px-4 py-2 transition ${mode === 'signup' ? 'bg-blue-500 text-white' : 'text-slate-300'}`}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-full px-4 py-2 transition ${mode === 'signin' ? 'bg-blue-500 text-white' : 'text-slate-300'}`}
            >
              Sign in
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === 'signup' && (
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-400"
                placeholder="Full name"
              />
            )}

            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-400"
              placeholder="Username"
            />

            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-400"
              placeholder="Password"
            />

            <button type="submit" className="w-full rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-400">
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Demo accounts: maya / password, alex / password, jordan / password
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-950 text-white">
      <aside className="w-full max-w-xs border-r border-slate-800 bg-slate-900/95 p-4">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 font-bold">
              {currentUser.avatar}
            </div>
            <div>
              <div className="font-semibold">{currentUser.name}</div>
              <div className="text-xs text-slate-400">{currentUser.status}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentUser(null)}
            className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300"
          >
            Log out
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-700 bg-slate-800 p-3">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Create group</h2>
          <form onSubmit={handleCreateGroup} className="space-y-3">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500"
              placeholder="Group name"
            />

            <div className="max-h-32 space-y-2 overflow-auto">
              {contactList.map((user) => (
                <label key={user.id} className="flex items-center justify-between rounded-lg bg-slate-900 px-2 py-2 text-sm text-slate-200">
                  <span>{user.name}</span>
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user.id)}
                    onChange={() => toggleMember(user.id)}
                  />
                </label>
              ))}
            </div>

            <button type="submit" className="w-full rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white">
              Start group
            </button>
          </form>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Chats</h2>
          </div>

          <div className="space-y-2">
            {chats.map((chat) => {
              const lastMessage = chat.messages[chat.messages.length - 1];
              const isSelected = chat.id === selectedChatId;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    isSelected ? 'border-blue-500 bg-slate-800' : 'border-slate-700 bg-slate-850 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{chat.name}</div>
                    <span className="text-[10px] text-slate-400">{chat.type === 'group' ? 'Group' : 'Direct'}</span>
                  </div>
                  <div className="mt-1 truncate text-sm text-slate-400">
                    {lastMessage ? `${users.find((user) => user.id === lastMessage.senderId)?.name ?? 'Someone'}: ${lastMessage.text}` : 'No messages yet'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold">{selectedChat?.name ?? 'Select a chat'}</h1>
            <p className="text-sm text-slate-400">
              {selectedChat?.type === 'group' ? 'Group chat' : 'Direct message'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {contactList.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => startNewChat(user.id)}
                className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
              >
                {user.name}
              </button>
            ))}
          </div>
        </header>

        <div className="flex flex-1 flex-col bg-slate-950">
          <div className="flex-1 space-y-4 overflow-auto p-6">
            {selectedChat?.messages.map((msg) => {
              const sender = users.find((user) => user.id === msg.senderId);
              const isMine = msg.senderId === currentUser.id;

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md rounded-2xl border p-3 ${isMine ? 'border-blue-500 bg-blue-500/15' : 'border-slate-700 bg-slate-900'}`}>
                    {!isMine && <div className="mb-1 text-xs font-semibold text-slate-300">{sender?.name ?? 'Unknown'}</div>}

                    {msg.kind === 'image' && msg.attachmentUrl && (
                      <img src={msg.attachmentUrl} alt={msg.fileName ?? 'Shared image'} className="mb-2 max-h-52 rounded-xl object-cover" />
                    )}

                    {msg.kind === 'file' && msg.attachmentUrl && (
                      <a
                        href={msg.attachmentUrl}
                        download={msg.fileName}
                        className="mb-2 block rounded-xl border border-dashed border-slate-600 bg-slate-800 px-3 py-2 text-sm text-blue-300 underline"
                      >
                        {msg.fileName}
                      </a>
                    )}

                    {msg.text && <div className="text-sm text-slate-100">{msg.text}</div>}

                    <div className="mt-2 text-[10px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center gap-3">
              <label className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700">
                + Attach
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              <span className="text-xs text-slate-400">Add a file or screenshot</span>
            </div>

            <div className="flex gap-3">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
              <button type="submit" className="rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-400">
                Send
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
