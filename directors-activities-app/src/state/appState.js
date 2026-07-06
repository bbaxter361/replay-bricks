import { createContext, createElement, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  activities,
  activityDrafts,
  bingoTransactions,
  books,
  calendarEvents,
  canvaTemplates,
  contacts,
  portalApps,
  residents,
  users,
} from '../data/sampleData';
import { loadLocalState, saveLocalState } from '../services/dataClient';
import { approveActivityDraft as approveDraft } from '../utils/activityDrafts';
import { addBingoTransaction as addPointsTransaction, getBingoBalance } from '../utils/bingoPoints';
import { createCalendarEventFromActivity, createMonthProposal } from '../utils/calendarPlanning';

const AppStateContext = createContext(null);

export const initialState = {
  users,
  currentUser: null,
  portalApps,
  canvaTemplates,
  activities,
  activityDrafts,
  residents,
  bingoTransactions,
  calendarEvents,
  contacts,
  books,
  springMessages: [
    {
      id: 'spring-welcome',
      role: 'assistant',
      content: "Hi Amanda. I'm Spring, and this local preview is ready to help shape your new activities workspace.",
      createdAt: '2026-07-06T09:00:00',
    },
  ],
  calendarView: 'day',
  wingFilter: 'combined',
  selectedResidentId: residents[0]?.id || null,
  selectedActivityId: activities[0]?.id || null,
  selectedAppNotice: null,
  canvaExportPreview: null,
  monthProposal: null,
};

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function springReplyFor(message) {
  const lower = message.toLowerCase();
  if (lower.includes('calendar') || lower.includes('month')) {
    return 'I can draft a day, week, or month plan from approved Activities and resident preferences. In this preview, I will show a reviewable proposal before anything is saved.';
  }
  if (lower.includes('activity') || lower.includes('website') || lower.includes('scan')) {
    return 'I can turn websites, scans, and uploaded files into Activity drafts. Amanda will review and approve them before they become official.';
  }
  if (lower.includes('resident') || lower.includes('bingo')) {
    return 'I can help summarize residents, preferences, attendance, and bingo points so Amanda can see who may need attention.';
  }
  return 'I am in local preview mode right now. The next phase will connect me to Amanda’s real saved data, Supabase, Canva, and the Obsidian archive.';
}

export function appReducer(state, action) {
  switch (action.type) {
    case 'setUser':
      return { ...state, currentUser: action.user, selectedAppNotice: null };
    case 'logout':
      return { ...state, currentUser: null, selectedAppNotice: null };
    case 'showAppNotice':
      return { ...state, selectedAppNotice: action.notice };
    case 'clearAppNotice':
      return { ...state, selectedAppNotice: null };
    case 'setCalendarView':
      return { ...state, calendarView: action.view };
    case 'setWingFilter':
      return { ...state, wingFilter: action.filter };
    case 'selectResident':
      return { ...state, selectedResidentId: action.residentId };
    case 'selectActivity':
      return { ...state, selectedActivityId: action.activityId };
    case 'approveActivityDraft': {
      const draft = state.activityDrafts.find((item) => item.id === action.draftId);
      if (!draft) return state;
      const approved = approveDraft(draft, { approvedBy: state.currentUser?.name || 'Amanda' });
      return {
        ...state,
        activities: [approved, ...state.activities],
        activityDrafts: state.activityDrafts.filter((item) => item.id !== action.draftId),
        selectedActivityId: approved.id,
      };
    }
    case 'createActivityDraft': {
      const draft = {
        id: makeId('draft'),
        status: 'draft',
        title: action.title || 'New Activity Draft',
        category: action.category || 'custom',
        bestFor: 'both',
        difficulty: 'easy',
        durationMinutes: 45,
        groupSize: 'small group',
        supplies: [],
        steps: ['Review source material.', 'Add clear instructions.', 'Approve when ready.'],
        safetyNotes: '',
        dementiaAdaptations: '',
        tags: ['draft'],
        source: action.source || { type: 'manual', label: 'Manual entry' },
        createdAt: new Date().toISOString(),
      };
      return { ...state, activityDrafts: [draft, ...state.activityDrafts] };
    }
    case 'addBingoTransaction':
      return {
        ...state,
        bingoTransactions: addPointsTransaction(state.bingoTransactions, {
          ...action.transaction,
          createdBy: state.currentUser?.name || 'Amanda',
        }),
      };
    case 'scheduleActivity': {
      const activity = state.activities.find((item) => item.id === action.activityId);
      if (!activity) return state;
      const event = createCalendarEventFromActivity({
        activity,
        start: action.start || '2026-07-08T10:00:00',
        wing: action.wing || activity.bestFor,
      });
      return { ...state, calendarEvents: [event, ...state.calendarEvents] };
    }
    case 'createMonthProposal':
      return {
        ...state,
        monthProposal: createMonthProposal({
          month: action.month || '2026-07',
          activities: state.activities.slice(0, 8),
        }),
      };
    case 'prepareCanvaExport':
      return {
        ...state,
        canvaExportPreview: {
          id: makeId('canva-export'),
          type: action.exportType,
          templateId: action.templateId,
          eventCount: state.calendarEvents.length,
          status: 'preview-ready',
          createdAt: new Date().toISOString(),
        },
      };
    case 'sendSpringMessage': {
      const userMessage = {
        id: makeId('spring-user'),
        role: 'user',
        content: action.message,
        createdAt: new Date().toISOString(),
      };
      const assistantMessage = {
        id: makeId('spring-assistant'),
        role: 'assistant',
        content: springReplyFor(action.message),
        createdAt: new Date().toISOString(),
      };
      return { ...state, springMessages: [...state.springMessages, userMessage, assistantMessage] };
    }
    default:
      return state;
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (fallback) => loadLocalState(fallback));

  useEffect(() => {
    saveLocalState(state);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return createElement(AppStateContext.Provider, { value }, children);
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside AppStateProvider');
  return context;
}

export function selectBingoBalance(state, residentId) {
  return getBingoBalance(residentId, state.bingoTransactions);
}
