/**
 * États et transitions dossier sinistre (scénario réparable / VE simplifiés).
 * Extensible pour couvrir l’intégralité du processus métier.
 */

const SCENARIO = {
  REPARABLE: 'reparable',
  TOTAL_LOSS: 'total_loss',
};

const STATE = {
  DOSSIER_INITIALISE: 'DOSSIER_INITIALISE',
  EXPERTISE_EN_ATTENTE: 'EXPERTISE_EN_ATTENTE',
  EXPERTISE_PLANIFIEE: 'EXPERTISE_PLANIFIEE',
  EXPERTISE_REALISEE: 'EXPERTISE_REALISEE',
  VEHICULE_REPARABLE: 'VEHICULE_REPARABLE',
  INTERVENTION_PLANIFIEE: 'INTERVENTION_PLANIFIEE',
  VEHICULE_RESTITUE: 'VEHICULE_RESTITUE',
  FACTURE_RECUE: 'FACTURE_RECUE',
  REGLEMENT_REALISE: 'REGLEMENT_REALISE',
  REFACTURATION_TIERS: 'REFACTURATION_TIERS',
  DOSSIER_CLOS: 'DOSSIER_CLOS',
  ESTIMATION_INDEMNISATION: 'ESTIMATION_INDEMNISATION',
  ESTIMATION_ACCEPTEE: 'ESTIMATION_ACCEPTEE',
  INDEMNISATION_REGLEE: 'INDEMNISATION_REGLEE',
};

/** @type {Record<string, Array<{ from: string, to: string, requiresManagerApproval?: boolean }>>} */
const TRANSITIONS = {
  [SCENARIO.REPARABLE]: [
    { from: STATE.DOSSIER_INITIALISE, to: STATE.EXPERTISE_EN_ATTENTE },
    { from: STATE.EXPERTISE_EN_ATTENTE, to: STATE.EXPERTISE_PLANIFIEE },
    { from: STATE.EXPERTISE_PLANIFIEE, to: STATE.EXPERTISE_REALISEE, requiresManagerApproval: true },
    { from: STATE.EXPERTISE_REALISEE, to: STATE.VEHICULE_REPARABLE },
    { from: STATE.VEHICULE_REPARABLE, to: STATE.INTERVENTION_PLANIFIEE },
    { from: STATE.INTERVENTION_PLANIFIEE, to: STATE.VEHICULE_RESTITUE },
    { from: STATE.VEHICULE_RESTITUE, to: STATE.FACTURE_RECUE, requiresManagerApproval: true },
    { from: STATE.FACTURE_RECUE, to: STATE.REGLEMENT_REALISE },
    { from: STATE.REGLEMENT_REALISE, to: STATE.REFACTURATION_TIERS },
    { from: STATE.REGLEMENT_REALISE, to: STATE.DOSSIER_CLOS },
    { from: STATE.REFACTURATION_TIERS, to: STATE.DOSSIER_CLOS },
  ],
  [SCENARIO.TOTAL_LOSS]: [
    { from: STATE.DOSSIER_INITIALISE, to: STATE.EXPERTISE_EN_ATTENTE },
    { from: STATE.EXPERTISE_EN_ATTENTE, to: STATE.EXPERTISE_PLANIFIEE },
    { from: STATE.EXPERTISE_PLANIFIEE, to: STATE.EXPERTISE_REALISEE, requiresManagerApproval: true },
    { from: STATE.EXPERTISE_REALISEE, to: STATE.ESTIMATION_INDEMNISATION },
    { from: STATE.ESTIMATION_INDEMNISATION, to: STATE.ESTIMATION_ACCEPTEE, requiresManagerApproval: true },
    { from: STATE.ESTIMATION_ACCEPTEE, to: STATE.INDEMNISATION_REGLEE },
    { from: STATE.INDEMNISATION_REGLEE, to: STATE.REFACTURATION_TIERS },
    { from: STATE.INDEMNISATION_REGLEE, to: STATE.DOSSIER_CLOS },
    { from: STATE.REFACTURATION_TIERS, to: STATE.DOSSIER_CLOS },
  ],
};

function getInitialState() {
  return STATE.DOSSIER_INITIALISE;
}

function findTransition(scenario, fromState, toState) {
  const list = TRANSITIONS[scenario] || [];
  return list.find((t) => t.from === fromState && t.to === toState) || null;
}

function isManagerRole(role) {
  return role === 'admin' || role === 'gestionnaire_portefeuille';
}

module.exports = {
  SCENARIO,
  STATE,
  TRANSITIONS,
  getInitialState,
  findTransition,
  isManagerRole,
};
