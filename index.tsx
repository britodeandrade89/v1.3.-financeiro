// @ts-nocheck
import { GoogleGenAI, Chat } from "@google/genai";
import { db, auth, isConfigured, firebaseConfig } from './firebase-config.js';
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

// =================================================================================
// ICONS & CATEGORIES
// =================================================================================
const ICONS = {
    add: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
    delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    income: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5l-5-5-5 5M17 19l-5 5-5 5"></path></svg>`,
    expense: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5l-5 5-5-5M17 19l-5-5-5-5"></path></svg>`,
    fixed: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    variable: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
    shopping: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    aiAnalysis: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 8.3 9c.5 1.1 1.4 2 2.7 2s2.2-.9 2.7-2c.1-.4.2-.8.3-1.3.6-1.1 0-2.3-1-3.1-.3-.2-.6-.3-1-.3z"></path><path d="M12 21c-1.2 0-2.4-.6-3-1.7A3.6 3.6 0 0 1 8.3 15c.5-1.1 1.4-2 2.7-2s2.2.9 2.7 2c.1.4.2.8.3 1.3.6 1.1 0 2.3-1 3.1-.3-.2-.6-.3-1 .3z"></path><path d="M3 12c0-1.2.6-2.4 1.7-3A3.6 3.6 0 0 1 9 8.3c1.1.5 2 1.4 2 2.7s-.9 2.2-2 2.7c.4.1.8.2-1.3.3-1.1.6-2.3 0-3.1-1 .2-.3-.3-.6-.3-1z"></path><path d="M21 12c0-1.2-.6-2.4-1.7-3A3.6 3.6 0 0 0 15 8.3c-1.1.5-2 1.4-2 2.7s.9 2.2 2 2.7c.4.1.8.2 1.3.3 1.1.6 2.3 0-3.1-1 .2-.3.3-.6-.3-1z"></path></svg>`,
    lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.09 16.05a2.41 2.41 0 0 1-2.41-2.41V10a4.69 4.69 0 0 0-9.38 0v3.64a2.41 2.41 0 0 1-2.41 2.41"></path><path d="M8.5 16.05V18a1.5 1.5 0 0 0 3 0v-1.95"></path><path d="M15.09 16.05a2.41 2.41 0 0 0 2.41-2.41V10a4.69 4.69 0 0 1 9.38 0v3.64a2.41 2.41 0 0 0 2.41 2.41"></path><path d="M17.5 16.05V18a1.5 1.5 0 0 1-3 0v-1.95"></path></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    goal: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
    savings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>`,
    investment: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"></path><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"></path><path d="M12 12h.01"></path></svg>`,
    sync: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M22 11.5A10 10 0 0 0 3.5 12.5"/><path d="M2 12.5a10 10 0 0 0 18.5-1"/></svg>`,
    cloudUp: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 12M15 9l-3-3-3 3"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
    cloudCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a5.3 5.3 0 0 1-4.2-2.1"/><path d="M12 22a5.3 5.3 0 0 0 4.2-2.1"/><path d="M15 16.5l-3-3-1.5 1.5"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
    cloudOff: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
    cityHall: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M10 9a2 2 0 1 1 4 0v12h-4V9z"/></svg>`,
    menu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
    eye: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    eyeOff: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`,
    refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`
};

const SPENDING_CATEGORIES = {
    moradia: { name: 'Moradia', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>` },
    alimentacao: { name: 'Alimentação', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`},
    transporte: { name: 'Transporte', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v1"></path><path d="M14 9H4.5a2.5 2.5 0 0 0 0 5H14a2.5 2.5 0 0 0 0-5z"></path><path d="M5 15h14"></path><circle cx="7" cy="19" r="2"></circle><circle cx="17" cy="19" r="2"></circle></svg>` },
    abastecimento_mumbuca: { name: 'Abastecimento com Mumbuca', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>` },
    saude: { name: 'Saúde', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L12 2A4.99 4.99 0 0 1 17 7L17 7A4.99 4.99 0 0 1 12 12L12 12A4.99 4.99 0 0 1 7 7L7 7A4.99 4.99 0 0 1 12 2z"></path><path d="M12 12L12 22"></path><path d="M17 7L22 7"></path><path d="M7 7L2 7"></path></svg>` },
    lazer: { name: 'Lazer', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>` },
    educacao: { name: 'Educação', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10v6M12 2v14M8 16L4 14M16 16l4-2M12 22a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4z"></path></svg>` },
    dividas: { name: 'Dívidas', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>` },
    pessoal: { name: 'Pessoal', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 16.5c-3.5 0-6.5 2-6.5 4.5h13c0-2.5-3-4.5-6.5-4.5z"></path><path d="M20.5 12c.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5z"></path><path d="M3.5 12c.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5z"></path></svg>` },
    investimento: { name: 'Investimento para Viagem', icon: ICONS.investment },
    shopping: { name: 'Compras com Mumbuca', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>` },
    avulsos: { name: 'Avulsos', icon: ICONS.variable },
    outros: { name: 'Outros', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>` },
};

const PAYMENT_SCHEDULE_2025 = {
    1: '2025-01-30',
    2: '2025-02-27',
    3: '2025-03-28',
    4: '2025-04-29',
    5: '2025-05-23',
    6: '2025-06-27', 
    7: '2025-07-30',
    8: '2025-08-28',
    9: '2025-09-29',
    10: '2025-10-30',
    11: '2025-11-27', 
    12: '2025-12-22',
};

// =================================================================================
// INITIAL DATA
// =================================================================================
const initialMonthData = {
    incomes: [],
    expenses: [],
    shoppingItems: [],
    avulsosItems: [],
    goals: [],
    savingsGoals: [],
    bankAccounts: [
        { id: "acc_1", name: "Nubank (André)", balance: 0.00, owner: 'Andre', type: 'corrente' },
        { id: "acc_2", name: "Nubank (Marcelly)", balance: 0.00, owner: 'Marcelly', type: 'corrente' },
    ]
};

// =================================================================================
// STATE & AI INSTANCE
// =================================================================================
let ai = new GoogleGenAI({ apiKey: firebaseConfig.apiKey }); // Re-use firebase API Key for demo purposes or should be process.env.API_KEY
let chat = null;
let currentMonthData = JSON.parse(JSON.stringify(initialMonthData));
let currentModalType = '';
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

// CSV Parsing State
let rawCSVData = [];
let csvHeaders = [];

let deferredPrompt;
let showBalance = true;
let isOfflineMode = false;
let currentUser = null;
let firestoreUnsubscribe = null;
let isSyncing = false;
let syncStatus = 'disconnected'; 
let syncErrorDetails = '';

// DOM Elements map
const elements = {
    monthDisplay: document.getElementById('monthDisplay'),
    currentDateDisplay: document.getElementById('currentDateDisplay'),
    headerGreeting: document.getElementById('headerGreeting'),
    headerBalanceValue: document.getElementById('headerBalanceValue'),
    toggleBalanceBtn: document.getElementById('toggleBalanceBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    menuBtn: document.getElementById('menuBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    
    // Cards - Section 1
    cardSalary: document.getElementById('card-salary'),
    salaryIncome: document.getElementById('salaryIncome'),
    salaryIncomeProgressBar: document.getElementById('salaryIncomeProgressBar'),
    salaryTotalValue: document.getElementById('salaryTotalValue'),
    salaryPendingValue: document.getElementById('salaryPendingValue'),
    
    cardExpenses: document.getElementById('card-expenses'),
    fixedVariableExpenses: document.getElementById('fixedVariableExpenses'),
    fixedVariableExpensesProgressBar: document.getElementById('fixedVariableExpensesProgressBar'),
    expensesTotalValue: document.getElementById('expensesTotalValue'),
    expensesPendingValue: document.getElementById('expensesPendingValue'),

    cardRemainder: document.getElementById('card-remainder'),
    salaryRemainder: document.getElementById('salaryRemainder'),
    salaryRemainderProgressBar: document.getElementById('salaryRemainderProgressBar'),

    // Cards - Section 2 (Mumbuca)
    cardMumbucaIncome: document.getElementById('card-mumbuca-income'),
    mumbucaIncome: document.getElementById('mumbucaIncome'),
    mumbucaIncomeProgressBar: document.getElementById('mumbucaIncomeProgressBar'),
    mumbucaTotalValue: document.getElementById('mumbucaTotalValue'),
    mumbucaPendingValue: document.getElementById('mumbucaPendingValue'),
    
    cardMumbucaExpenses: document.getElementById('card-mumbuca-expenses'),
    mumbucaExpenses: document.getElementById('mumbucaExpenses'),
    mumbucaExpensesProgressBar: document.getElementById('mumbucaExpensesProgressBar'),
    mumbucaExpensesTotalValue: document.getElementById('mumbucaExpensesTotalValue'),
    mumbucaExpensesPendingValue: document.getElementById('mumbucaExpensesPendingValue'),

    cardMumbucaBalance: document.getElementById('card-mumbuca-balance'),
    mumbucaBalance: document.getElementById('mumbucaBalance'),
    mumbucaBalanceProgressBar: document.getElementById('mumbucaBalanceProgressBar'),

    // Cards - Section 3 (General)
    generalTotalIncome: document.getElementById('generalTotalIncome'),
    generalTotalExpenses: document.getElementById('generalTotalExpenses'),

    // Cards - Marcia Brito
    marciaTotalDisplay: document.getElementById('marciaTotalDisplay'),
    marciaTotalBill: document.getElementById('marciaTotalBill'),
    
    // Cards - Patrimony
    patrimonyAndre: document.getElementById('patrimonyAndre'),
    patrimonyMarcelly: document.getElementById('patrimonyMarcelly'),

    // Other
    debtSummaryContainer: document.getElementById('debtSummaryContainer'),
    
    incomesList: document.getElementById('incomesList'),
    expensesList: document.getElementById('expensesList'),
    comprasMumbucaList: document.getElementById('comprasMumbucaList'),
    abastecimentoMumbucaList: document.getElementById('abastecimentoMumbucaList'),
    avulsosList: document.getElementById('avulsosList'),
    goalsList: document.getElementById('goalsList'),
    bankAccountsList: document.getElementById('bankAccountsList'),
    bankAccountsListAndre: document.getElementById('bankAccountsListAndre'),
    bankAccountsListMarcelly: document.getElementById('bankAccountsListMarcelly'),
    overviewChart: document.getElementById('overviewChart'),
    monthlyAnalysisSection: document.getElementById('monthlyAnalysisSection'),
    appContainer: document.getElementById('app-container'),
    mainContent: document.getElementById('main-content'),
    addModal: document.getElementById('addModal'),
    editModal: document.getElementById('editModal'),
    aiModal: document.getElementById('aiModal'),
    goalModal: document.getElementById('goalModal'),
    accountModal: document.getElementById('accountModal'),
    savingsGoalModal: document.getElementById('savingsGoalModal'),
    csvImportModal: document.getElementById('csvImportModal'),
    addModalTitle: document.getElementById('addModalTitle'),
    addForm: document.getElementById('addForm'),
    typeGroup: document.getElementById('typeGroup'),
    categoryGroup: document.getElementById('categoryGroup'),
    sourceAccountGroup: document.getElementById('sourceAccountGroup'),
    installmentsGroup: document.getElementById('installmentsGroup'),
    dateGroup: document.getElementById('dateGroup'),
    transactionDateLabel: document.getElementById('transactionDateLabel'),
    transactionDateInput: document.getElementById('transactionDate'),
    editForm: document.getElementById('editForm'),
    editModalTitle: document.getElementById('editModalTitle'),
    editItemId: document.getElementById('editItemId'),
    editItemType: document.getElementById('editItemType'),
    editDescription: document.getElementById('editDescription'),
    editAmount: document.getElementById('editAmount'),
    editSourceAccountGroup: document.getElementById('editSourceAccountGroup'),
    editSourceAccount: document.getElementById('editSourceAccount'),
    editCategoryGroup: document.getElementById('editCategoryGroup'),
    editCategory: document.getElementById('editCategory'),
    editDueDate: document.getElementById('editDueDate'),
    editDueDateGroup: document.getElementById('editDueDateGroup'),
    editPaidDate: document.getElementById('editPaidDate'),
    editPaidDateGroup: document.getElementById('editPaidDateGroup'),
    editInstallmentsGroup: document.getElementById('editInstallmentsGroup'),
    editCurrentInstallment: document.getElementById('editCurrentInstallment'),
    editTotalInstallments: document.getElementById('editTotalInstallments'),
    editInstallmentsInfo: document.getElementById('editInstallmentsInfo'),
    aiAnalysis: document.getElementById('aiAnalysis'),
    aiModalTitle: document.getElementById('aiModalTitle'),
    aiChatForm: document.getElementById('aiChatForm'),
    aiChatInput: document.getElementById('aiChatInput'),
    goalModalTitle: document.getElementById('goalModalTitle'),
    goalForm: document.getElementById('goalForm'),
    goalId: document.getElementById('goalId'),
    goalCategory: document.getElementById('goalCategory'),
    goalAmount: document.getElementById('goalAmount'),
    accountModalTitle: document.getElementById('accountModalTitle'),
    accountForm: document.getElementById('accountForm'),
    accountId: document.getElementById('accountId'),
    accountName: document.getElementById('accountName'),
    accountOwner: document.getElementById('accountOwner'),
    accountType: document.getElementById('accountType'),
    accountBalance: document.getElementById('accountBalance'),
    accountLimit: document.getElementById('accountLimit'),
    accountDueDay: document.getElementById('accountDueDay'),
    savingsGoalsList: document.getElementById('savingsGoalsList'),
    savingsGoalModalTitle: document.getElementById('savingsGoalModalTitle'),
    savingsGoalForm: document.getElementById('savingsGoalForm'),
    savingsGoalId: document.getElementById('savingsGoalId'),
    savingsGoalDescription: document.getElementById('savingsGoalDescription'),
    savingsGoalCurrent: document.getElementById('savingsGoalCurrent'),
    savingsGoalTarget: document.getElementById('savingsGoalTarget'),
    tabBar: document.getElementById('tab-bar'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    appViews: document.querySelectorAll('.app-view'),
    segmentedBtns: document.querySelectorAll('.segmented-btn'),
    syncBtn: document.getElementById('sync-btn'),
    
    // CSV Import Elements
    csvDropZone: document.getElementById('csvDropZone'),
    csvFileInput: document.getElementById('csvFileInput'),
    csvPreviewSection: document.getElementById('csvPreviewSection'),
    mapDateCol: document.getElementById('mapDateCol'),
    mapDescCol: document.getElementById('mapDescCol'),
    mapAmountCol: document.getElementById('mapAmountCol'),
    csvPreviewTable: document.getElementById('csvPreviewTable'),
    processCsvBtn: document.getElementById('processCsvBtn'),

    // AI Scan Elements
    aiScanBtn: document.getElementById('ai-scan-btn'),
    screenshotInput: document.getElementById('screenshotInput'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Text Paste Elements
    pasteTextBtn: document.getElementById('paste-text-btn'),
    textPasteModal: document.getElementById('textPasteModal'),
    pastedTextInput: document.getElementById('pastedTextInput'),
    processTextBtn: document.getElementById('processTextBtn'),
};

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseCurrency(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !value) return 0;
    
    // Check for Brazilian format: 1.000,00
    if (value.includes(',') && !value.includes('.')) {
         value = value.replace(',', '.');
    } else if (value.includes('.') && value.includes(',')) {
         value = value.replace(/\./g, '').replace(',', '.');
    }
    
    const digits = value.replace(/[^0-9.-]/g, '');
    return parseFloat(digits) || 0;
}

function getMonthName(month) {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return months[month - 1];
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getTodayFormatted() {
    return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
}

function simpleMarkdownToHtml(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n\s*-\s/g, '<br>• ').replace(/\n\s*\*\s/g, '<br>• ').replace(/\n/g, '<br>');
}

function populateCategorySelects() {
    const selects = [document.getElementById('category'), document.getElementById('editCategory')];
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Selecione...</option>';
            for (const key in SPENDING_CATEGORIES) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = SPENDING_CATEGORIES[key].name;
                select.appendChild(option);
            }
        }
    });
    const goalCategorySelect = document.getElementById('goalCategory');
    if (goalCategorySelect) {
        goalCategorySelect.innerHTML = '<option value="">Selecione...</option>';
        Object.keys(SPENDING_CATEGORIES).filter(key => key !== 'avulsos').forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = SPENDING_CATEGORIES[key].name;
            goalCategorySelect.appendChild(option);
        });
    }
}

function populateAccountSelects() {
    const selects = [document.getElementById('sourceAccount'), document.getElementById('editSourceAccount')];
    const accounts = currentMonthData.bankAccounts || [];
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '';
            accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = `${account.name} (${account.type === 'credito' ? 'Fatura' : 'Saldo'})`;
                select.appendChild(option);
            });
        }
    });
}

function updateSyncButtonState() {
    const syncBtn = document.getElementById('sync-btn');
    const statusText = document.getElementById('sync-status-text');
    const statusInfo = document.getElementById('sync-status-info');
    const userIdContainer = document.getElementById('user-id-container');
    const userIdText = document.getElementById('user-id-text');
    
    if (!syncBtn) return;

    if (currentUser) {
        userIdContainer.style.display = 'block';
        userIdText.textContent = currentUser.uid.substring(0,8) + '...';
    } else {
        userIdContainer.style.display = 'none';
    }
    
    if (syncStatus === 'syncing') {
        syncBtn.textContent = 'Sincronizando...';
        syncBtn.disabled = true;
        statusText.textContent = 'Sincronizando...';
        statusText.style.color = 'var(--warning)';
    } else if (syncStatus === 'synced') {
        syncBtn.textContent = 'Sincronizar Agora';
        syncBtn.disabled = false;
        statusText.textContent = 'Sincronizado';
        statusText.style.color = 'var(--success)';
        statusInfo.textContent = 'Última sincronização: ' + new Date().toLocaleTimeString();
    } else if (syncStatus === 'error') {
        syncBtn.textContent = 'Tentar Novamente';
        syncBtn.disabled = false;
        statusText.textContent = 'Erro';
        statusText.style.color = 'var(--danger)';
        statusInfo.textContent = syncErrorDetails || 'Falha na conexão.';
    } else {
        syncBtn.textContent = 'Conectar/Sincronizar';
        syncBtn.disabled = false;
        statusText.textContent = 'Desconectado (Local)';
        statusText.style.color = 'var(--text-light)';
        statusInfo.textContent = isOfflineMode ? 'Modo Offline Ativo' : 'Aguardando conexão...';
    }
}

function updateLastSyncTime(success) {
    const statusInfo = document.getElementById('sync-status-info');
    if (statusInfo) {
        if (success) {
            statusInfo.textContent = 'Salvo na nuvem: ' + new Date().toLocaleTimeString();
        } 
    }
}

function updateUI() {
    updateSummary();
    updateMonthDisplay();
    updateSyncButtonState();
}

async function saveDataToFirestore() {
    if (isOfflineMode) {
        const monthKey = `financeData_${currentYear}_${currentMonth}`;
        localStorage.setItem(monthKey, JSON.stringify(currentMonthData));
        syncStatus = 'disconnected';
        updateSyncButtonState();
        return;
    }
    if (!currentUser || !isConfigured) return;
    if (isSyncing) return;
    isSyncing = true;
    syncStatus = 'syncing';
    updateSyncButtonState();
    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);
    try {
        const cleanData = JSON.parse(JSON.stringify(currentMonthData));
        await setDoc(docRef, cleanData);
        syncStatus = 'synced';
        updateLastSyncTime(true);
    } catch (error) {
        if (error.code === 'permission-denied' || error.code === 'unavailable') {
            isOfflineMode = true;
            syncStatus = 'disconnected';
            const monthKey = `financeData_${currentYear}_${currentMonth}`;
            localStorage.setItem(monthKey, JSON.stringify(currentMonthData));
            updateSyncButtonState();
            return;
        }
        syncStatus = 'error';
        syncErrorDetails = "Não foi possível salvar os dados na nuvem.";
    } finally {
        isSyncing = false;
        updateSyncButtonState();
    }
}

function saveData() { updateUI(); saveDataToFirestore(); }

function loadDataForCurrentMonth() {
    if (isOfflineMode) {
        const localKey = `financeData_${currentYear}_${currentMonth}`;
        const saved = localStorage.getItem(localKey);
        if (saved) { currentMonthData = JSON.parse(saved); } else { createNewMonthData(); return; }
        updateUI(); updateMonthDisplay(); return;
    }
    if (!currentUser || !isConfigured) return;
    if (firestoreUnsubscribe) firestoreUnsubscribe();
    const monthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    const docRef = doc(db, 'users', currentUser.uid, 'months', monthKey);
    firestoreUnsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            currentMonthData = JSON.parse(JSON.stringify(docSnap.data()));
            updateUI();
        } else {
            createNewMonthData();
        }
        updateMonthDisplay();
    }, (error) => {
        if (error.code === 'permission-denied' || error.code === 'unavailable' || error.message.includes('permission')) {
             isOfflineMode = true; syncStatus = 'error'; syncErrorDetails = "Modo Offline (Permissão Negada)";
             if (firestoreUnsubscribe) firestoreUnsubscribe();
             const localKey = `financeData_${currentYear}_${currentMonth}`;
             const saved = localStorage.getItem(localKey);
             if (saved) { currentMonthData = JSON.parse(saved); } else { createNewMonthData(); return; }
             updateUI(); updateMonthDisplay(); updateSyncButtonState();
        } else {
            syncStatus = 'error'; updateSyncButtonState();
        }
    });
}

async function createNewMonthData() {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    let baseData = null;
    if (isOfflineMode) {
        const prevKey = `financeData_${prevYear}_${prevMonth}`;
        const prevSaved = localStorage.getItem(prevKey);
        if (prevSaved) baseData = JSON.parse(prevSaved);
    } else if (currentUser && isConfigured) {
         const previousMonthKey = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
         const prevDocRef = doc(db, 'users', currentUser.uid, 'months', previousMonthKey);
         try { const prevDocSnap = await getDoc(prevDocRef); if (prevDocSnap.exists()) baseData = JSON.parse(JSON.stringify(prevDocSnap.data())); } catch (e) {}
    }
    if (!baseData) baseData = JSON.parse(JSON.stringify(initialMonthData));

    const newMonthData = {
        incomes: [], expenses: [], shoppingItems: [], avulsosItems: [],
        goals: JSON.parse(JSON.stringify(baseData.goals || [])),
        savingsGoals: JSON.parse(JSON.stringify(baseData.savingsGoals || [])),
        bankAccounts: JSON.parse(JSON.stringify(baseData.bankAccounts || []))
    };
    
    // Ensure all accounts have default fields if missing
    newMonthData.bankAccounts.forEach(acc => {
        if (!acc.owner) acc.owner = 'Andre';
        if (!acc.type) acc.type = 'corrente';
        // Reset balances might be annoying if manual, but safer for new month? 
        // Let's keep credit card balance as 0 (invoice paid) but keep savings?
        // For simple logic, we keep balances as is, user updates manually.
    });

    const paymentDate = PAYMENT_SCHEDULE_2025[currentMonth];
    if (paymentDate && currentYear === 2025) {
        newMonthData.incomes.push(
            { id: `inc_sal_m_${Date.now()}`, description: 'SALARIO MARCELLY (Prefeitura)', amount: 3349.92, paid: false, date: paymentDate, category: 'Salário' },
            { id: `inc_sal_a_${Date.now()}`, description: 'SALARIO ANDRE (Prefeitura)', amount: 3349.92, paid: false, date: paymentDate, category: 'Salário' }
        );
    }
    if (currentYear === 2025 && currentMonth === 6) {
         const date = PAYMENT_SCHEDULE_2025[6];
         newMonthData.incomes.push(
            { id: `inc_13_1_m_${Date.now()}`, description: '1ª PARCELA 13º MARCELLY', amount: 3349.92 / 2, paid: false, date: date, category: 'Salário' },
            { id: `inc_13_1_a_${Date.now()}`, description: '1ª PARCELA 13º ANDRE', amount: 3349.92 / 2, paid: false, date: date, category: 'Salário' }
        );
    }
    if (currentYear === 2025 && currentMonth === 12) {
         newMonthData.incomes.push(
            { id: `inc_13_2_m_${Date.now()}`, description: '2ª PARCELA 13º MARCELLY', amount: 3349.92 / 2, paid: false, date: '2025-12-05', category: 'Salário' },
            { id: `inc_13_2_a_${Date.now()}`, description: '2ª PARCELA 13º ANDRE', amount: 3349.92 / 2, paid: false, date: '2025-12-05', category: 'Salário' }
        );
    }
    newMonthData.incomes.push(
        { id: `inc_mum_m_${Date.now()}`, description: 'MUMBUCA MARCELLY', amount: 650.00, paid: false, date: `${currentYear}-${currentMonth.toString().padStart(2,'0')}-15` },
        { id: `inc_mum_a_${Date.now()}`, description: 'MUMBUCA ANDRE', amount: 650.00, paid: false, date: `${currentYear}-${currentMonth.toString().padStart(2,'0')}-15` }
    );
    (baseData.expenses || []).forEach(expense => {
        let shouldAdd = false;
        const newExpense = { ...expense, id: `exp_${Date.now()}_${Math.random()}`, paid: false, paidDate: null };
        if (expense.total > 1 && expense.current < expense.total) { newExpense.current += 1; shouldAdd = true; } 
        else if (expense.cyclic) { newExpense.current = 1; shouldAdd = true; }
        if(shouldAdd) {
             const oldDate = new Date(expense.dueDate);
             oldDate.setMonth(oldDate.getMonth() + 1);
             newExpense.dueDate = oldDate.toISOString().split('T')[0];
             newMonthData.expenses.push(newExpense);
        }
    });

    if (newMonthData.expenses.length === 0) {
        const defaultExpenses = [
            { description: 'Repasse Márcia Brito', category: 'dividas', type: 'fixed', day: 10, amount: 0 },
            { description: 'Conta de Luz', category: 'moradia', type: 'variable', day: 10, amount: 0 },
            { description: 'Conta de Água', category: 'moradia', type: 'variable', day: 10, amount: 0 },
            { description: 'Internet', category: 'moradia', type: 'fixed', day: 15, amount: 0 },
            { description: 'Mercado Mensal', category: 'alimentacao', type: 'variable', day: 5, amount: 0 },
            { description: 'Cartão de Crédito', category: 'outros', type: 'variable', day: 10, amount: 0 }
        ];

        defaultExpenses.forEach(def => {
             newMonthData.expenses.push({
                id: `exp_def_${Date.now()}_${Math.random()}`,
                description: def.description,
                amount: def.amount,
                category: def.category,
                type: def.type,
                paid: false,
                paidDate: null,
                dueDate: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${def.day.toString().padStart(2, '0')}`,
                cyclic: true,
                current: 1,
                total: 1
            });
        });
    }

    currentMonthData = newMonthData;
    saveData();
}

function changeMonth(offset) {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;

    if (newMonth > 12) {
        newMonth = 1;
        newYear++;
    } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
    }

    currentMonth = newMonth;
    currentYear = newYear;
    loadDataForCurrentMonth();
}

function updateMonthDisplay() {
    elements.monthDisplay.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
    const now = new Date();
    if (currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear()) {
         elements.currentDateDisplay.textContent = getTodayFormatted();
         elements.headerGreeting.textContent = `${getGreeting()}, Família Bispo Brito`;
    } else {
         elements.currentDateDisplay.textContent = `Visualizando ${getMonthName(currentMonth)}`;
         elements.headerGreeting.textContent = "Resumo Mensal";
    }
}

function updateSummary() {
    if (!currentMonthData) return;
    
    // --- 1. SALÁRIOS (Dinheiro) ---
    const cashIncomes = currentMonthData.incomes.filter(i => !i.description.toLowerCase().includes('mumbuca'));
    const cashIncomesTotal = cashIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const cashIncomesReceived = cashIncomes.filter(i => i.paid).reduce((acc, curr) => acc + curr.amount, 0);
    const cashIncomesPending = cashIncomesTotal - cashIncomesReceived;

    if (elements.salaryTotalDisplay) elements.salaryTotalDisplay.textContent = formatCurrency(cashIncomesTotal).replace('R$', '').trim();
    if (elements.salaryIncome) elements.salaryIncome.textContent = formatCurrency(cashIncomesReceived);
    if (elements.salaryPendingValue) elements.salaryPendingValue.textContent = formatCurrency(cashIncomesPending);
    if (elements.salaryIncomeProgressBar) elements.salaryIncomeProgressBar.style.width = cashIncomesTotal > 0 ? `${(cashIncomesReceived / cashIncomesTotal) * 100}%` : '0%';

    // --- 2. DESPESAS GERAIS (Dinheiro) ---
    const cashExpenses = currentMonthData.expenses.filter(e => true); 
    const cashExpensesTotal = cashExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const cashExpensesPaid = cashExpenses.filter(e => e.paid).reduce((acc, curr) => acc + curr.amount, 0);
    const cashExpensesPending = cashExpensesTotal - cashExpensesPaid;

    if (elements.expensesTotalDisplay) elements.expensesTotalDisplay.textContent = formatCurrency(cashExpensesTotal).replace('R$', '').trim();
    if (elements.fixedVariableExpenses) elements.fixedVariableExpenses.textContent = formatCurrency(cashExpensesPaid);
    if (elements.expensesPendingValue) elements.expensesPendingValue.textContent = formatCurrency(cashExpensesPending);
    if (elements.fixedVariableExpensesProgressBar) elements.fixedVariableExpensesProgressBar.style.width = cashExpensesTotal > 0 ? `${(cashExpensesPaid / cashExpensesTotal) * 100}%` : '0%';

    // --- 3. BALANÇO SALÁRIO (Dinheiro) ---
    const salaryRemainder = cashIncomesReceived - cashExpensesPaid;
    if (elements.salaryRemainder) elements.salaryRemainder.textContent = formatCurrency(salaryRemainder).replace('R$', '').trim();
    if (elements.salaryRemainderProgressBar) {
        elements.salaryRemainderProgressBar.style.width = '100%';
        elements.salaryRemainderProgressBar.className = `summary-progress-bar-inner ${salaryRemainder >= 0 ? 'safe' : 'danger'}`;
    }

    // --- 4. MUMBUCA (Entradas) ---
    const mumbucaIncomes = currentMonthData.incomes.filter(i => i.description.toLowerCase().includes('mumbuca'));
    const mumbucaTotal = mumbucaIncomes.reduce((acc, curr) => acc + curr.amount, 0);
    const mumbucaReceived = mumbucaIncomes.filter(i => i.paid).reduce((acc, curr) => acc + curr.amount, 0);
    const mumbucaPending = mumbucaTotal - mumbucaReceived;

    if (elements.mumbucaTotalDisplay) elements.mumbucaTotalDisplay.textContent = formatCurrency(mumbucaTotal).replace('R$', '').trim();
    if (elements.mumbucaIncome) elements.mumbucaIncome.textContent = formatCurrency(mumbucaReceived);
    if (elements.mumbucaPendingValue) elements.mumbucaPendingValue.textContent = formatCurrency(mumbucaPending);
    if (elements.mumbucaIncomeProgressBar) elements.mumbucaIncomeProgressBar.style.width = mumbucaTotal > 0 ? `${(mumbucaReceived / mumbucaTotal) * 100}%` : '0%';

    // --- 5. MUMBUCA (Gastos - Compras + Abastecimento) ---
    const mumbucaShopping = currentMonthData.shoppingItems || [];
    const allMumbucaExpenses = [...mumbucaShopping];
    const mumbucaExpensesTotal = allMumbucaExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const mumbucaExpensesPaid = allMumbucaExpenses.filter(e => e.paid).reduce((acc, curr) => acc + curr.amount, 0);
    const mumbucaExpensesPending = mumbucaExpensesTotal - mumbucaExpensesPaid;

    if (elements.mumbucaExpensesTotalDisplay) elements.mumbucaExpensesTotalDisplay.textContent = formatCurrency(mumbucaExpensesTotal).replace('R$', '').trim();
    if (elements.mumbucaExpenses) elements.mumbucaExpenses.textContent = formatCurrency(mumbucaExpensesPaid);
    if (elements.mumbucaExpensesPendingValue) elements.mumbucaExpensesPendingValue.textContent = formatCurrency(mumbucaExpensesPending);
    if (elements.mumbucaExpensesProgressBar) elements.mumbucaExpensesProgressBar.style.width = mumbucaExpensesTotal > 0 ? `${(mumbucaExpensesPaid / mumbucaExpensesTotal) * 100}%` : '0%';

    // --- 6. BALANÇO MUMBUCA ---
    const mumbucaBalance = mumbucaReceived - mumbucaExpensesPaid;
    if (elements.mumbucaBalance) elements.mumbucaBalance.textContent = formatCurrency(mumbucaBalance).replace('R$', '').trim();
    if (elements.mumbucaBalanceProgressBar) {
         elements.mumbucaBalanceProgressBar.style.width = '100%';
         elements.mumbucaBalanceProgressBar.className = `summary-progress-bar-inner ${mumbucaBalance >= 0 ? 'safe' : 'danger'}`;
    }

    // --- 7. HEADER BALANCE (Saldo Global Disponível - Mumbuca + Dinheiro) ---
    const totalBalance = salaryRemainder + mumbucaBalance;
    if (elements.headerBalanceValue) {
        elements.headerBalanceValue.textContent = showBalance ? formatCurrency(totalBalance) : 'R$ ••••';
    }
    
    // --- 8. REPASSE MÁRCIA BRITO ---
    const marciaExpenses = currentMonthData.expenses.filter(e => {
        const desc = e.description ? e.description.toLowerCase() : '';
        return desc.includes('marcia') || desc.includes('márcia');
    });
    const marciaTotal = marciaExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const marciaPaid = marciaExpenses.filter(e => e.paid).reduce((acc, curr) => acc + curr.amount, 0);
    const marciaPending = marciaTotal - marciaPaid;

    if (elements.marciaTotalDisplay) elements.marciaTotalDisplay.textContent = formatCurrency(marciaPending).replace('R$', '').trim();
    if (elements.marciaTotalBill) elements.marciaTotalBill.textContent = formatCurrency(marciaTotal);

    // --- 9. RESUMO GERAL ---
    const totalGeneralIncome = cashIncomesTotal + mumbucaTotal; 
    const avulsosExpenses = currentMonthData.avulsosItems || [];
    const avulsosTotal = avulsosExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalGeneralExpenses = cashExpensesTotal + mumbucaExpensesTotal + avulsosTotal;

    if (elements.generalTotalIncome) elements.generalTotalIncome.textContent = formatCurrency(totalGeneralIncome).replace('R$', '').trim();
    if (elements.generalTotalExpenses) elements.generalTotalExpenses.textContent = formatCurrency(totalGeneralExpenses).replace('R$', '').trim();
    
    // --- 10. PATRIMÔNIO POR PESSOA (NOVO) ---
    const accounts = currentMonthData.bankAccounts || [];
    let andreTotal = 0;
    let marcellyTotal = 0;

    accounts.forEach(acc => {
        // Se for cartão de crédito, subtrai o valor (dívida da fatura). Se for conta, soma.
        const val = acc.type === 'credito' ? -acc.balance : acc.balance;
        if (acc.owner === 'Andre') andreTotal += val;
        else if (acc.owner === 'Marcelly') marcellyTotal += val;
        else {
            // Conta Conjunta - Divide por 2
            andreTotal += val / 2;
            marcellyTotal += val / 2;
        }
    });

    if (elements.patrimonyAndre) elements.patrimonyAndre.textContent = formatCurrency(andreTotal);
    if (elements.patrimonyMarcelly) elements.patrimonyMarcelly.textContent = formatCurrency(marcellyTotal);

    renderLists();
}

function renderBankAccounts(container, ownerFilter) {
    if (!container) return;
    container.innerHTML = '';
    
    const accounts = (currentMonthData.bankAccounts || []).filter(acc => acc.owner === ownerFilter || (ownerFilter === 'Andre' && acc.owner === 'Conjunta')); // Show joint for Andre by default or duplicate? Let's just strict filter
    
    if (accounts.length === 0) {
        container.innerHTML = `<div style="text-align:center; font-size:0.8rem; color:var(--text-light); padding:0.5rem;">Nenhuma conta conectada.</div>`;
        return;
    }

    accounts.forEach(acc => {
         const div = document.createElement('div');
         div.className = 'account-item';
         div.onclick = () => openAccountModal(acc.id);
         
         let icon = ICONS.wallet; // Default
         if (acc.type === 'credito') icon = ICONS.shopping;
         else if (acc.type === 'poupanca') icon = ICONS.savings;

         let balanceLabel = acc.type === 'credito' ? 'Fatura Atual' : 'Saldo';
         let balanceColor = acc.type === 'credito' ? 'var(--danger)' : 'var(--success)';
         let extraInfo = '';

         if (acc.type === 'credito' && acc.limit) {
             const available = parseFloat(acc.limit) - parseFloat(acc.balance);
             extraInfo = `<div style="font-size:0.7rem; color:var(--text-light);">Disp: ${formatCurrency(available)}</div>`;
         } else if (acc.dueDay) {
             extraInfo = `<div style="font-size:0.7rem; color:var(--text-light);">Vence dia ${acc.dueDay}</div>`;
         }

         div.innerHTML = `
            <div style="flex:1;">
                <div class="account-name" style="font-size:0.9rem;">${acc.name}</div>
                ${extraInfo}
            </div>
            <div style="text-align:right;">
                <span class="account-balance" style="color:${balanceColor}; font-size:1rem;">${formatCurrency(acc.balance)}</span>
                <div style="font-size:0.7rem; color:var(--text-light);">${balanceLabel}</div>
            </div>
         `;
         container.appendChild(div);
    });
}

function renderList(container, items, type) {
    if (!container) return;
    container.innerHTML = '';
    if (!items || items.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-light); padding:1rem; font-size:0.9rem;">Nenhum lançamento.</div>';
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
            <button class="check-btn ${item.paid ? 'paid' : ''}" data-id="${item.id}" data-type="${type}">${ICONS.check}</button>
            <div class="item-info-wrapper" onclick="openEditModal('${item.id}', '${type}')">
                <div class="item-primary-info">
                    <span class="item-description ${item.paid ? 'paid' : ''}">${item.description}</span>
                    <span class="item-amount ${type === 'income' ? 'income-amount' : 'expense-amount'}">${formatCurrency(item.amount)}</span>
                </div>
                <div class="item-secondary-info">
                    <span class="item-meta">
                        ${SPENDING_CATEGORIES[item.category]?.icon || ''} ${SPENDING_CATEGORIES[item.category]?.name || item.category || 'Geral'}
                    </span>
                    <span class="item-meta">
                        ${ICONS.calendar} ${formatDate(item.dueDate || item.date)}
                    </span>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

window.openAccountModal = (id) => {
    const acc = currentMonthData.bankAccounts.find(a => a.id === id);
    if (!acc) return;
    elements.accountId.value = acc.id;
    elements.accountName.value = acc.name;
    elements.accountBalance.value = formatCurrency(acc.balance).replace('R$', '').trim();
    if(elements.accountOwner) elements.accountOwner.value = acc.owner || 'Andre';
    if(elements.accountType) elements.accountType.value = acc.type || 'corrente';
    if(elements.accountLimit) elements.accountLimit.value = acc.limit ? formatCurrency(acc.limit).replace('R$', '').trim() : '';
    if(elements.accountDueDay) elements.accountDueDay.value = acc.dueDay || '';
    
    elements.accountModal.classList.add('active');
};

window.openEditModal = (id, type) => {
    let item = null;
    let list = [];
    
    if (type === 'income') list = currentMonthData.incomes;
    else if (type === 'expense') list = currentMonthData.expenses;
    else if (type === 'shopping') list = currentMonthData.shoppingItems;
    else if (type === 'avulsos') list = currentMonthData.avulsosItems;
    
    item = list.find(i => i.id === id);
    if (!item) return;

    elements.editItemId.value = id;
    elements.editItemType.value = type;
    elements.editDescription.value = item.description;
    elements.editAmount.value = formatCurrency(item.amount).replace('R$', '').trim();
    
    if (elements.editCategory) elements.editCategory.value = item.category || '';
    if (elements.editSourceAccount) elements.editSourceAccount.value = item.sourceAccountId || '';
    if (elements.editDueDate) elements.editDueDate.value = item.dueDate || item.date || '';
    if (elements.editPaidDate) elements.editPaidDate.value = item.paidDate || '';
    
    elements.editModal.classList.add('active');
};

function togglePaidStatus(id, type) {
    let list = [];
    if (type === 'income') list = currentMonthData.incomes;
    else if (type === 'expense') list = currentMonthData.expenses;
    else if (type === 'shopping') list = currentMonthData.shoppingItems;
    else if (type === 'avulsos') list = currentMonthData.avulsosItems;
    
    const item = list.find(i => i.id === id);
    if (item) {
        item.paid = !item.paid;
        item.paidDate = item.paid ? new Date().toISOString().split('T')[0] : null;
        
        // Update Account Balance Logic
        if (item.sourceAccountId) {
            const acc = currentMonthData.bankAccounts.find(a => a.id === item.sourceAccountId);
            if (acc) {
                if (type === 'income') {
                    acc.balance += item.paid ? item.amount : -item.amount;
                } else {
                    acc.balance -= item.paid ? item.amount : -item.amount;
                }
            }
        }
        
        saveData();
    }
}

// =================================================================================
// CSV IMPORT FUNCTIONS
// =================================================================================
function parseCSVLine(line) {
    const chars = line.split('');
    const fields = [];
    let field = '';
    let insideQuotes = false;
    
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if ((char === ',' || char === ';') && !insideQuotes) {
            fields.push(field.trim());
            field = '';
        } else {
            field += char;
        }
    }
    fields.push(field.trim());
    return fields;
}

function convertDateFromCSV(dateString) {
    // Tries to handle DD/MM/YYYY
    if (!dateString) return new Date().toISOString().split('T')[0];
    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            // Assume DD/MM/YYYY or DD/MM/YY
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            let year = parts[2];
            if (year.length === 2) year = '20' + year;
            return `${year}-${month}-${day}`;
        }
    }
    // Assume it's already ISO or try standard date parse
    return dateString;
}

function processCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
            alert("O arquivo CSV parece estar vazio.");
            return;
        }

        // Parse header
        csvHeaders = parseCSVLine(lines[0]);
        rawCSVData = lines.slice(1).map(line => parseCSVLine(line));

        // Populate Selects
        const selects = [elements.mapDateCol, elements.mapDescCol, elements.mapAmountCol];
        selects.forEach(select => {
            select.innerHTML = '';
            csvHeaders.forEach((header, index) => {
                const opt = document.createElement('option');
                opt.value = index;
                opt.textContent = header;
                select.appendChild(opt);
            });
        });

        // Try to auto-select common headers
        csvHeaders.forEach((header, index) => {
            const h = header.toLowerCase();
            if (h.includes('data') || h.includes('date')) elements.mapDateCol.value = index;
            if (h.includes('desc') || h.includes('memo') || h.includes('historico')) elements.mapDescCol.value = index;
            if (h.includes('valor') || h.includes('amount')) elements.mapAmountCol.value = index;
        });

        elements.csvPreviewSection.style.display = 'block';
        elements.processCsvBtn.disabled = false;
        
        updateCSVPreview();
    };
    reader.readAsText(file);
}

function updateCSVPreview() {
    const table = elements.csvPreviewTable;
    table.innerHTML = '';
    
    // Header Row
    const trHead = document.createElement('tr');
    csvHeaders.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        trHead.appendChild(th);
    });
    table.appendChild(trHead);

    // First 5 rows preview
    rawCSVData.slice(0, 5).forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
}

function importCSVData() {
    const dateIdx = parseInt(elements.mapDateCol.value);
    const descIdx = parseInt(elements.mapDescCol.value);
    const amountIdx = parseInt(elements.mapAmountCol.value);

    let importedCount = 0;

    rawCSVData.forEach(row => {
        if (!row[dateIdx] && !row[amountIdx]) return;

        const dateStr = row[dateIdx];
        const descStr = row[descIdx] || 'Sem descrição';
        const amountStr = row[amountIdx];

        const finalDate = convertDateFromCSV(dateStr);
        const rawAmount = parseCurrency(amountStr);
        const absAmount = Math.abs(rawAmount);

        if (absAmount === 0) return;

        const newItem = {
            id: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            description: descStr,
            amount: absAmount,
            date: finalDate,
            dueDate: finalDate,
            paid: true, // Imported transactions are usually already processed
            paidDate: finalDate,
            sourceAccountId: null 
        };

        // Logic: Negative = Expense, Positive = Income
        if (rawAmount < 0) {
            newItem.category = 'outros';
            newItem.type = 'variable';
            currentMonthData.expenses.push(newItem);
        } else {
            newItem.category = 'outros'; // Default category for income
            currentMonthData.incomes.push(newItem);
        }
        importedCount++;
    });

    saveData();
    alert(`${importedCount} transações importadas com sucesso!`);
    elements.csvImportModal.classList.remove('active');
    
    // Reset inputs
    elements.csvFileInput.value = '';
    elements.csvPreviewSection.style.display = 'none';
}

// =================================================================================
// AI SCREENSHOT & PDF READER FUNCTIONS
// =================================================================================
async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    elements.loadingOverlay.style.display = 'flex';

    try {
        const imagePart = await fileToGenerativePart(file);
        
        const prompt = `
            Você é um assistente financeiro especialista. Analise este extrato bancário (pode ser imagem ou PDF).
            Extraia todas as transações financeiras visíveis.
            
            Para cada transação, identifique:
            1. Data (no formato YYYY-MM-DD, assuma o ano atual ${currentYear} se não estiver explícito).
            2. Descrição (nome do estabelecimento ou tipo de transação).
            3. Valor (número decimal positivo).
            4. Tipo: "income" se for entrada/depósito/pix recebido/crédito, "expense" se for saída/compra/pix enviado/débito.
            
            Retorne APENAS um JSON válido no seguinte formato, sem markdown ou explicações adicionais:
            [
                { "date": "YYYY-MM-DD", "description": "...", "amount": 0.00, "type": "expense" }
            ]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                role: "user",
                parts: [imagePart, { text: prompt }]
            }
        });

        processAIResponse(response.text);

    } catch (error) {
        console.error("Erro na leitura do arquivo:", error);
        alert("Erro ao processar o arquivo. Certifique-se de que é uma imagem ou PDF legível.");
    } finally {
        elements.loadingOverlay.style.display = 'none';
        elements.screenshotInput.value = ''; // Reset
    }
}

async function handleTextPaste() {
    const text = elements.pastedTextInput.value.trim();
    if (!text) return;

    elements.textPasteModal.classList.remove('active');
    elements.loadingOverlay.style.display = 'flex';

    try {
        const prompt = `
            Analise o seguinte texto copiado de um extrato bancário.
            Extraia as transações financeiras.
            Texto:
            "${text}"
            
            Para cada transação, identifique:
            1. Data (no formato YYYY-MM-DD, assuma o ano atual ${currentYear} se não estiver explícito).
            2. Descrição (nome do estabelecimento ou tipo de transação).
            3. Valor (número decimal positivo).
            4. Tipo: "income" se for entrada/depósito/pix recebido/crédito, "expense" se for saída/compra/pix enviado/débito.
            
            Retorne APENAS um JSON válido no seguinte formato, sem markdown:
            [
                { "date": "YYYY-MM-DD", "description": "...", "amount": 0.00, "type": "expense" }
            ]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { role: "user", parts: [{ text: prompt }] }
        });

        processAIResponse(response.text);

    } catch (error) {
        console.error("Erro na análise de texto:", error);
        alert("Erro ao processar o texto.");
    } finally {
        elements.loadingOverlay.style.display = 'none';
        elements.pastedTextInput.value = '';
    }
}

function processAIResponse(responseText) {
    try {
        const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const transactions = JSON.parse(jsonString);

        if (transactions && transactions.length > 0) {
            let count = 0;
            transactions.forEach(t => {
                const newItem = {
                    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    description: t.description,
                    amount: Math.abs(t.amount),
                    date: t.date,
                    dueDate: t.date,
                    paid: true, // Screenshots/Exports usually show processed transactions
                    paidDate: t.date,
                    category: 'outros', // Default
                    type: 'variable'
                };

                if (t.type === 'income') {
                    currentMonthData.incomes.push(newItem);
                } else {
                    currentMonthData.expenses.push(newItem);
                }
                count++;
            });
            saveData();
            alert(`${count} transações identificadas e adicionadas! Verifique a lista para categorizá-las.`);
        } else {
            alert('Não foi possível identificar transações claras nos dados fornecidos.');
        }
    } catch (e) {
        console.error("Erro ao fazer parse do JSON da IA:", e);
        alert("A IA não retornou um formato válido. Tente novamente com uma imagem/texto mais claro.");
    }
}

function init() {
    // Populate Selects
    populateCategorySelects();
    populateAccountSelects();
    
    // Auth logic ... (remains same)
    if (isConfigured && auth) {
         onAuthStateChanged(auth, (user) => {
             if (user) {
                 currentUser = user;
                 loadDataForCurrentMonth();
                 updateSyncButtonState();
             } else {
                 signInAnonymously(auth).catch((error) => {
                     isOfflineMode = true;
                     loadDataForCurrentMonth();
                     updateSyncButtonState();
                 });
             }
         });
    } else {
        isOfflineMode = true;
        loadDataForCurrentMonth();
        updateSyncButtonState();
    }

    // Event Listeners ... (remains same)
    if (elements.menuBtn) elements.menuBtn.addEventListener('click', () => {
        elements.sidebar.classList.add('active');
        elements.sidebarOverlay.classList.add('active');
    });
    
    if (elements.closeSidebarBtn) elements.closeSidebarBtn.addEventListener('click', () => {
        elements.sidebar.classList.remove('active');
        elements.sidebarOverlay.classList.remove('active');
    });

    if (elements.sidebarOverlay) elements.sidebarOverlay.addEventListener('click', () => {
        elements.sidebar.classList.remove('active');
        elements.sidebarOverlay.classList.remove('active');
    });
    
    // Header Actions
    document.querySelector('.prev-month')?.addEventListener('click', () => changeMonth(-1));
    document.querySelector('.next-month')?.addEventListener('click', () => changeMonth(1));
    elements.toggleBalanceBtn?.addEventListener('click', () => {
        showBalance = !showBalance;
        updateSummary();
    });
    
    // Refresh Button
    document.getElementById('open-ai-btn-header')?.addEventListener('click', () => {
       window.location.reload(); 
    });

    // Navigation Tabs
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const viewId = btn.dataset.view;
            elements.appViews.forEach(view => {
                view.classList.remove('active');
                if (view.id === `view-${viewId}`) view.classList.add('active');
            });
        });
    });

    // Segmented Control (Lançamentos)
    elements.segmentedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.segmentedBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const listId = btn.dataset.list;
            document.querySelectorAll('.list-view').forEach(l => l.style.display = 'none');
            const listEl = document.getElementById(`list-${listId}`);
            if (listEl) listEl.style.display = 'block';
        });
    });

    // Modals Open
    document.getElementById('add-income-btn')?.addEventListener('click', () => { currentModalType = 'income'; elements.addModalTitle.textContent = 'Nova Entrada'; elements.typeGroup.style.display='none'; populateAccountSelects(); elements.addModal.classList.add('active'); });
    document.getElementById('add-expense-btn')?.addEventListener('click', () => { currentModalType = 'expense'; elements.addModalTitle.textContent = 'Nova Despesa'; elements.typeGroup.style.display='block'; populateAccountSelects(); elements.addModal.classList.add('active'); });
    document.getElementById('add-compras-mumbuca-btn')?.addEventListener('click', () => { currentModalType = 'shopping'; elements.addModalTitle.textContent = 'Compra Mumbuca'; elements.typeGroup.style.display='none'; elements.addModal.classList.add('active'); });
    document.getElementById('add-avulso-btn')?.addEventListener('click', () => { currentModalType = 'avulsos'; elements.addModalTitle.textContent = 'Novo Avulso'; elements.typeGroup.style.display='none'; elements.addModal.classList.add('active'); });
    
    // CSV Import Modal Open
    document.getElementById('open-csv-btn')?.addEventListener('click', () => {
        elements.csvImportModal.classList.add('active');
    });

    // Add Account Button (Sidebar)
    document.getElementById('add-account-btn')?.addEventListener('click', () => {
        elements.accountForm.reset();
        elements.accountId.value = `acc_${Date.now()}`;
        elements.accountModal.classList.add('active');
    });

    // AI Scan Button (Combined PDF/Image)
    if (elements.aiScanBtn) {
        elements.aiScanBtn.addEventListener('click', () => {
            elements.screenshotInput.click();
        });
    }

    if (elements.screenshotInput) {
        elements.screenshotInput.addEventListener('change', handleFileUpload);
    }

    // Text Paste Button
    if (elements.pasteTextBtn) {
        elements.pasteTextBtn.addEventListener('click', () => {
            elements.textPasteModal.classList.add('active');
        });
    }

    if (elements.processTextBtn) {
        elements.processTextBtn.addEventListener('click', handleTextPaste);
    }

    // CSV File Handling
    if (elements.csvDropZone) {
        elements.csvDropZone.addEventListener('click', () => elements.csvFileInput.click());
        elements.csvDropZone.addEventListener('dragover', (e) => { e.preventDefault(); elements.csvDropZone.style.background = '#e6fffa'; });
        elements.csvDropZone.addEventListener('dragleave', (e) => { e.preventDefault(); elements.csvDropZone.style.background = 'var(--surface-light)'; });
        elements.csvDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.csvDropZone.style.background = 'var(--surface-light)';
            if (e.dataTransfer.files.length > 0) processCSVFile(e.dataTransfer.files[0]);
        });
    }

    if (elements.csvFileInput) {
        elements.csvFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) processCSVFile(e.target.files[0]);
        });
    }

    if (elements.processCsvBtn) {
        elements.processCsvBtn.addEventListener('click', importCSVData);
    }

    // Modals Close
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        });
    });

    // Forms
    elements.addForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const amount = parseCurrency(formData.get('amount'));
        if (amount <= 0) return;

        const newItem = {
            id: `${currentModalType}_${Date.now()}`,
            description: formData.get('description'),
            amount: amount,
            category: formData.get('category'),
            date: formData.get('transactionDate') || new Date().toISOString().split('T')[0],
            dueDate: formData.get('transactionDate') || new Date().toISOString().split('T')[0], // Default due date same as date
            paid: false,
            sourceAccountId: formData.get('sourceAccount')
        };

        if (currentModalType === 'income') currentMonthData.incomes.push(newItem);
        else if (currentModalType === 'expense') currentMonthData.expenses.push(newItem);
        else if (currentModalType === 'shopping') currentMonthData.shoppingItems.push(newItem);
        else if (currentModalType === 'avulsos') currentMonthData.avulsosItems.push(newItem);

        saveData();
        e.target.reset();
        elements.addModal.classList.remove('active');
    });
    
    // Account Form Submit
    elements.accountForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = elements.accountId.value;
        const balance = parseCurrency(elements.accountBalance.value);
        const limit = elements.accountLimit.value ? parseCurrency(elements.accountLimit.value) : 0;
        
        const newAcc = {
            id: id,
            name: elements.accountName.value,
            balance: balance,
            owner: elements.accountOwner.value,
            type: elements.accountType.value,
            limit: limit,
            dueDay: elements.accountDueDay.value
        };

        const index = currentMonthData.bankAccounts.findIndex(a => a.id === id);
        if (index >= 0) {
            currentMonthData.bankAccounts[index] = newAcc;
        } else {
            currentMonthData.bankAccounts.push(newAcc);
        }
        
        saveData();
        populateAccountSelects(); // Refresh dropdowns
        elements.accountModal.classList.remove('active');
    });
    
    elements.editForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = elements.editItemId.value;
        const type = elements.editItemType.value;
        const amount = parseCurrency(elements.editAmount.value);
        
        let list = [];
        if (type === 'income') list = currentMonthData.incomes;
        else if (type === 'expense') list = currentMonthData.expenses;
        else if (type === 'shopping') list = currentMonthData.shoppingItems;
        else if (type === 'avulsos') list = currentMonthData.avulsosItems;
        
        const item = list.find(i => i.id === id);
        if (item) {
            item.description = elements.editDescription.value;
            item.amount = amount;
            item.category = elements.editCategory.value;
            item.dueDate = elements.editDueDate.value;
            if (elements.editPaidDate.value) item.paidDate = elements.editPaidDate.value;
            if (elements.editSourceAccount.value) item.sourceAccountId = elements.editSourceAccount.value;
            saveData();
            elements.editModal.classList.remove('active');
        }
    });

    document.getElementById('deleteItemBtn')?.addEventListener('click', () => {
        const id = elements.editItemId.value;
        const type = elements.editItemType.value;
        
        if (type === 'income') currentMonthData.incomes = currentMonthData.incomes.filter(i => i.id !== id);
        else if (type === 'expense') currentMonthData.expenses = currentMonthData.expenses.filter(i => i.id !== id);
        else if (type === 'shopping') currentMonthData.shoppingItems = currentMonthData.shoppingItems.filter(i => i.id !== id);
        else if (type === 'avulsos') currentMonthData.avulsosItems = currentMonthData.avulsosItems.filter(i => i.id !== id);
        
        saveData();
        elements.editModal.classList.remove('active');
    });

    // Check Button Delegation
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.check-btn');
        if (btn) {
            e.stopPropagation();
            togglePaidStatus(btn.dataset.id, btn.dataset.type);
        }
    });
    
    // Sync Button
    if (elements.syncBtn) elements.syncBtn.addEventListener('click', saveDataToFirestore);
}

// Start App
init();