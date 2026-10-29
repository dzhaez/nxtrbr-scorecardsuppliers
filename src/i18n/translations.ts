export type LanguageCode = 'pt' | 'en' | 'pl' | 'es';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export interface Translation {
  // Language selector
  selectLanguage: string;

  // Login screen
  appTitle: string;
  appSubtitle: string;
  loginTab: string;
  firstAccessTab: string;
  userId: string;
  userIdPlaceholder: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  loginButton: string;
  registerButton: string;
  signingIn: string;
  registering: string;
  showPassword: string;
  hidePassword: string;
  loginError: string;
  entraDescription: string;
  entraSignInButton: string;
  entraError: string;
  entraNotAuthorized: string;
  entraNotConfigured: string;
  devModeButton: string;
  firstAccessError: string;
  idAlreadyRegistered: string;
  idNotFoundInSpreadsheet: string;
  passwordMismatch: string;
  passwordTooShort: string;
  fillAllFields: string;
  invalidEmail: string;
  adminAutoDetected: string;

  // Main screen header
  cycle: string;
  refresh: string;
  admin: string;
  logout: string;

  // Dashboard KPIs
  totalSuppliers: string;
  evaluated: string;
  pending: string;
  generalAverage: string;
  approvalRate: string;
  riskSuppliers: string;
  consistency: string;

  // Dashboard charts
  evaluationDistribution: string;
  cycleProgress: string;
  scoreByCriterion: string;
  evaluationTrend: string;
  performanceByCommodity: string;
  quality: string;
  delivery: string;
  cost: string;
  completed: string;
  remaining: string;
  accumulatedAverage: string;
  count: string;

  // Supplier list
  pendingEvaluation: string;
  evaluatedSuppliers: string;
  noPendingSuppliers: string;
  allCaughtUp: string;
  searchPlaceholder: string;
  allCommodities: string;
  allStatus: string;
  statusAll: string;
  statusPending: string;
  statusEvaluated: string;
  sortBy: string;
  sortCode: string;
  sortOrders: string;
  sortName: string;
  sortStatus: string;
  ascending: string;
  descending: string;
  ord: string;
  loc: string;
  owner: string;
  evaluate: string;
  evaluatedBtn: string;
  evaluatedBadge: string;
  pendingBadge: string;

  // Evaluation form
  evaluationTitle: string;
  mandatoryAnswer: string;
  question1: string;
  question2: string;
  question3: string;
  ratingPoor: string;
  ratingGood: string;
  ratingExcellent: string;
  commentsOptional: string;
  commentsPlaceholder: string;
  calculatedAverage: string;
  answerAllQuestions: string;
  alreadyEvaluated: string;
  errorSaving: string;
  cancel: string;
  saveEvaluation: string;
  saving: string;
  readyToSave: string;

  // Classification labels
  classificationPoor: string;
  classificationGood: string;
  classificationExcellent: string;

  // Admin screen
  back: string;
  adminArea: string;
  history: string;
  panel: string;
  import: string;
  accesses: string;
  importExcel: string;
  importDescription: string;
  clickToSelect: string;
  supportedFormats: string;
  recordsDetected: string;
  expectedColumns: string;
  colLocEmb: string;
  colNomeClas: string;
  colCnpjCpf: string;
  colCommodities: string;
  colIdUser: string;
  colOwner: string;
  noValidRecords: string;
  errorReadingFile: string;
  importAndGenerate: string;
  importing: string;
  importStepSuppliers: string;
  importStepOrders: string;
  importSuccess: string;
  importError: string;
  showing: string;
  of: string;
  records: string;

  // Admin accesses
  accessHistory: string;
  accessHistoryDesc: string;
  noAccessRegistered: string;
  user: string;
  dateAndTime: string;

  // Import history modal
  importHistory: string;
  close: string;
  noImportsRegistered: string;
  file: string;
  date: string;

  // Admin data management
  deleteAllData: string;
  deleteAllDataDesc: string;
  deleteAllConfirm: string;
  deleteAllWarning: string;
  confirm: string;
  cancelDelete: string;
  deleting: string;
  deleteSuccess: string;
  deleteError: string;
  filterCycles: string;
  filterCyclesDesc: string;
  noCyclesAvailable: string;
  selectCycle: string;
  allCycles: string;
  cycleLabel: string;
  importDate: string;
  fileName: string;
  orderCount: string;

  // Management panel
  managementPanel: string;
  managementPanelDesc: string;
  loadingPanel: string;
  evaluations: string;
  pendingKpi: string;
  generalAverageKpi: string;
  approvalRateKpi: string;
  riskIndex: string;
  consistencyKpi: string;
  purchaseCoverage: string;
  orders: string;
  completedPct: string;
  ofTotal: string;
  evaluationsCount: string;
  excellentSuppliers: string;
  riskSuppliersCount: string;
  deviation: string;
  uncoveredOrders: string;
  activeFilter: string;
  clear: string;

  // Management panel charts
  riskMatrix: string;
  noEvaluationsForMatrix: string;
  evaluationVolume: string;
  averageScore: string;
  ordersAxis: string;
  score: string;
  evaluationsAxis: string;

  // Strategic supplier view
  strategicSupplierView: string;
  strategicSupplierDesc: string;
  tierExcellent: string;
  tierGood: string;
  tierPoor: string;
  tierNotEvaluated: string;
  strategicRanking: string;
  evaluatedCount: string;
  noSuppliersEvaluated: string;
  position: string;
  supplier: string;
  commodity: string;
  ownerCol: string;
  evaluationsCol: string;
  scoreCol: string;

  // All suppliers
  allSuppliers: string;
  allSuppliersDesc: string;
  allCommoditiesFilter: string;
  allOwnersFilter: string;
  previous: string;
  next: string;

  // Commodity performance
  commodityPerformance: string;
  commodityPerformanceDesc: string;
  noCommodities: string;
  averageByCommodity: string;
  evaluationCoverage: string;
  noEvaluations: string;
  suppliersShort: string;

  // Owner performance
  ownerPerformance: string;
  ownerPerformanceDesc: string;
  noOwners: string;
  averageByOwner: string;

  // Cycle evolution
  cycleEvolution: string;
  cycleEvolutionDesc: string;
  noCycles: string;
  current: string;

  // User progress
  userProgress: string;
  userProgressDesc: string;
  noUserFound: string;
  idUser: string;
  ownersCol: string;
  suppliersCol: string;
  evaluatedCol: string;
  pendingCol: string;
  progress: string;
  averageCol: string;

  // Loading
  loading: string;

  // Main screen empty states
  noSuppliersForUser: string;
  noSuppliersMatchSearch: string;
  loadingSuppliers: string;

  // Admin management
  admins: string;
  adminsDesc: string;
  addAdmin: string;
  adminOidPlaceholder: string;
  adminDisplayName: string;
  adminDisplayNamePlaceholder: string;
  addAdminButton: string;
  removeAdmin: string;
  removeAdminConfirm: string;
  noAdminsRegistered: string;
  adminAdded: string;
  adminRemoved: string;
  adminAddError: string;
  adminRemoveError: string;
  cannotRemoveLastAdmin: string;
  objectId: string;
  authorizedBy: string;
  authorizedAt: string;
  auditLog: string;
  auditLogDesc: string;
  noAuditEntries: string;
  auditAction: string;
  auditTarget: string;
  auditActor: string;
  auditDate: string;
  grant: string;
  revoke: string;
  selectExistingUser: string;
  addByOid: string;
}

const pt: Translation = {
  selectLanguage: 'Selecione o idioma',

  appTitle: 'Scorecard Indirect Suppliers',
  appSubtitle: 'Avaliação de Desempenho de Fornecedores',
  loginTab: 'Login',
  firstAccessTab: 'Primeiro Acesso',
  userId: 'ID do Usuário',
  userIdPlaceholder: 'Digite seu ID',
  email: 'E-mail',
  emailPlaceholder: 'Digite seu e-mail',
  password: 'Senha',
  passwordPlaceholder: 'Digite sua senha',
  confirmPassword: 'Confirmar Senha',
  confirmPasswordPlaceholder: 'Confirme sua senha',
  loginButton: 'Entrar',
  registerButton: 'Cadastrar',
  signingIn: 'Entrando...',
  registering: 'Cadastrando...',
  showPassword: 'Mostrar senha',
  hidePassword: 'Ocultar senha',
  loginError: 'ID ou senha inválidos. Verifique e tente novamente.',
  entraDescription: 'Entre com sua conta corporativa Microsoft para acessar o sistema.',
  entraSignInButton: 'Entrar com Microsoft',
  entraError: 'Não foi possível entrar com sua conta Microsoft. Tente novamente.',
  entraNotAuthorized: 'Sua conta não tem acesso a este sistema. Procure o administrador.',
  entraNotConfigured: 'O acesso com Microsoft ainda não foi configurado. Procure o suporte.',
  devModeButton: 'Entrar em modo desenvolvimento',
  firstAccessError: 'Não foi possível cadastrar. Verifique os dados e tente novamente.',
  idAlreadyRegistered: 'Este ID já está cadastrado no sistema.',
  idNotFoundInSpreadsheet: 'Este ID não foi encontrado na planilha importada.',
  passwordMismatch: 'As senhas não coincidem.',
  passwordTooShort: 'A senha deve ter no mínimo 8 caracteres.',
  fillAllFields: 'Preencha todos os campos.',
  invalidEmail: 'E-mail inválido.',
  adminAutoDetected: 'Acesso de administrador detectado.',

  cycle: 'Ciclo',
  refresh: 'Atualizar',
  admin: 'Admin',
  logout: 'Sair',

  totalSuppliers: 'Total Fornecedores',
  evaluated: 'Avaliados',
  pending: 'Pendentes',
  generalAverage: 'Média Geral',
  approvalRate: 'Taxa de Aprovação',
  riskSuppliers: 'Fornecedores de Risco',
  consistency: 'Consistência',

  evaluationDistribution: 'Distribuição de Avaliações',
  cycleProgress: 'Progresso do Ciclo',
  scoreByCriterion: 'Nota por Critério',
  evaluationTrend: 'Tendência de Avaliações',
  performanceByCommodity: 'Desempenho por Commodity',
  quality: 'Qualidade',
  delivery: 'Entrega',
  cost: 'Custo',
  completed: 'Concluído',
  remaining: 'Restante',
  accumulatedAverage: 'Média Acumulada',
  count: 'Contagem',

  pendingEvaluation: 'Pendentes de Avaliação',
  evaluatedSuppliers: 'Fornecedores Avaliados',
  noPendingSuppliers: 'Nenhum fornecedor pendente',
  allCaughtUp: 'Tudo em dia! Todos os fornecedores foram avaliados.',
  searchPlaceholder: 'Buscar por razão social ou código...',
  allCommodities: 'Todas Commodities',
  allStatus: 'Todos os status',
  statusAll: 'Todos',
  statusPending: 'Pendentes',
  statusEvaluated: 'Avaliados',
  sortBy: 'Ordenar por',
  sortCode: 'Código',
  sortOrders: 'Qtd Ordens',
  sortName: 'Nome',
  sortStatus: 'Status',
  ascending: 'Crescente',
  descending: 'Decrescente',
  ord: 'ORD.',
  loc: 'Loc',
  owner: 'Owner',
  evaluate: 'Avaliar',
  evaluatedBtn: 'Avaliado',
  evaluatedBadge: 'Avaliado',
  pendingBadge: 'Pendente',

  evaluationTitle: 'Avaliação de Fornecedor',
  mandatoryAnswer: 'Resposta obrigatória',
  question1: 'Os prazos de entrega do fornecedor estiveram dentro do prazo acordado?',
  question2: 'O tempo de resposta do fornecedor esteve dentro de um prazo aceitável?',
  question3: 'O produto/serviço do fornecedor foi entregue com a qualidade adequada?',
  ratingPoor: 'Ruim',
  ratingGood: 'Bom',
  ratingExcellent: 'Ótimo',
  commentsOptional: 'Comentários (opcional)',
  commentsPlaceholder: 'Adicione observações sobre o fornecedor...',
  calculatedAverage: 'Média Calculada',
  answerAllQuestions: 'Responda todas as 3 perguntas obrigatórias.',
  alreadyEvaluated: 'Este fornecedor já foi avaliado neste ciclo.',
  errorSaving: 'Erro ao salvar avaliação. Tente novamente.',
  cancel: 'Cancelar',
  saveEvaluation: 'Salvar Avaliação',
  saving: 'Salvando...',
  readyToSave: 'Pronto para salvar',

  classificationPoor: 'Ruim',
  classificationGood: 'Bom',
  classificationExcellent: 'Ótimo',

  back: 'Voltar',
  adminArea: 'Área Administrativa',
  history: 'Histórico',
  panel: 'Painel',
  import: 'Importar',
  accesses: 'Acessos',
  importExcel: 'Importar Planilha Excel',
  importDescription: 'Selecione um arquivo .xlsx. A importação substituirá a base ativa e gerará um novo ciclo de avaliação.',
  clickToSelect: 'Clique para selecionar um arquivo',
  supportedFormats: 'Formatos suportados: .xlsx, .xls',
  recordsDetected: 'registros detectados',
  expectedColumns: 'Colunas esperadas na planilha:',
  colLocEmb: 'Loc Emb',
  colNomeClas: 'Nome Clas',
  colCnpjCpf: 'CNPJ/CPF',
  colCommodities: 'Commodities',
  colIdUser: 'ID USER',
  colOwner: 'OWNER',
  noValidRecords: 'Nenhum registro válido encontrado. Verifique as colunas da planilha.',
  errorReadingFile: 'Erro ao ler o arquivo. Verifique se é um Excel válido (.xlsx).',
  importAndGenerate: 'Importar e Gerar Novo Ciclo',
  importing: 'Importando...',
  importSuccess: 'Importação concluída! Ciclo {ciclo} criado com {count} fornecedores.',
  importError: 'Não foi possível concluir a importação. Verifique o arquivo e tente novamente.',
  showing: 'Mostrando',
  of: 'de',
  records: 'registros',

  accessHistory: 'Histórico de Acessos',
  accessHistoryDesc: 'Registro de data e hora de cada acesso à ferramenta',
  noAccessRegistered: 'Nenhum acesso registrado ainda.',
  user: 'Usuário',
  dateAndTime: 'Data e Hora',

  importHistory: 'Histórico de Importações',
  close: 'Fechar',
  noImportsRegistered: 'Nenhuma importação registrada.',
  file: 'Arquivo',
  date: 'Data',

  importStepSuppliers: 'Importando fornecedores',
  importStepOrders: 'Importando ordens de compra',
  deleteAllData: 'Apagar Todos os Dados Importados',
  deleteAllDataDesc: 'Remove permanentemente todas as ordens de compra, importações e avaliações de todos os ciclos.',
  deleteAllConfirm: 'Confirma a exclusão de todos os dados importados?',
  deleteAllWarning: 'Esta ação é irreversível. Todos os ciclos, ordens de compra e avaliações serão removidos.',
  confirm: 'Confirmar',
  cancelDelete: 'Cancelar',
  deleting: 'Excluindo...',
  deleteSuccess: 'Todos os dados importados foram excluídos com sucesso.',
  deleteError: 'Erro ao excluir os dados. Tente novamente.',
  filterCycles: 'Filtrar Ciclos Importados',
  filterCyclesDesc: 'Selecione um ciclo para visualizar seus detalhes ou filtrar os dados por ciclo.',
  noCyclesAvailable: 'Nenhum ciclo disponível para filtragem.',
  selectCycle: 'Selecionar Ciclo',
  allCycles: 'Todos os Ciclos',
  cycleLabel: 'Ciclo',
  importDate: 'Data de Importação',
  fileName: 'Arquivo',
  orderCount: 'Ordens',

  managementPanel: 'Painel de Gerenciamento Estratégico',
  managementPanelDesc: 'Visão geral do ciclo {ciclo} e histórico completo',
  loadingPanel: 'Carregando dados do painel...',
  evaluations: 'Avaliações',
  pendingKpi: 'Pendentes',
  generalAverageKpi: 'Média Geral',
  approvalRateKpi: 'Taxa de Aprovação',
  riskIndex: 'Índice de Risco',
  consistencyKpi: 'Consistência',
  purchaseCoverage: 'Cobertura de Compras',
  orders: 'ordens',
  completedPct: 'concluído',
  ofTotal: 'do total',
  evaluationsCount: 'avaliações',
  excellentSuppliers: 'fornecedores ótimos',
  riskSuppliersCount: 'fornecedores de risco',
  deviation: 'Desvio',
  uncoveredOrders: 'ordens descobertas',
  activeFilter: 'Filtro ativo:',
  clear: 'limpar',

  riskMatrix: 'Matriz de Risco',
  noEvaluationsForMatrix: 'Sem avaliações para exibir a matriz de risco.',
  evaluationVolume: 'Volume de Avaliações',
  averageScore: 'Score Médio',
  ordersAxis: 'Ordens',
  score: 'Score',
  evaluationsAxis: 'Avaliações',

  strategicSupplierView: 'Visão Estratégica de Fornecedores',
  strategicSupplierDesc: 'Distribuição por tier de performance e ranking completo dos fornecedores avaliados',
  tierExcellent: 'Ótimos',
  tierGood: 'Bons',
  tierPoor: 'Ruins',
  tierNotEvaluated: 'Não Avaliados',
  strategicRanking: 'Ranking Estratégico de Fornecedores',
  evaluatedCount: 'avaliados',
  noSuppliersEvaluated: 'Nenhum fornecedor avaliado ainda.',
  position: '#',
  supplier: 'Fornecedor',
  commodity: 'Commodity',
  ownerCol: 'Owner',
  evaluationsCol: 'Avaliações',
  scoreCol: 'Score',

  allSuppliers: 'Todos os Fornecedores',
  allSuppliersDesc: '{shown} de {total} fornecedores cadastrados no sistema',
  allCommoditiesFilter: 'Todas Commodities',
  allOwnersFilter: 'Todos Owners',
  previous: 'Anterior',
  next: 'Próximo',

  commodityPerformance: 'Desempenho por Commodity',
  commodityPerformanceDesc: 'Agrupamento de fornecedores por tipo de commodity',
  noCommodities: 'Nenhuma commodity cadastrada.',
  averageByCommodity: 'Média por Commodity',
  evaluationCoverage: 'Cobertura de Avaliações',
  noEvaluations: 'Sem avaliações',
  suppliersShort: 'forn.',

  ownerPerformance: 'Desempenho por Owner',
  ownerPerformanceDesc: 'Agrupamento de fornecedores por responsável (OWNER)',
  noOwners: 'Nenhum owner cadastrado.',
  averageByOwner: 'Média por Owner',

  cycleEvolution: 'Evolução por Ciclo',
  cycleEvolutionDesc: 'Histórico de todos os ciclos de avaliação importados',
  noCycles: 'Nenhum ciclo importado ainda.',
  current: 'atual',

  userProgress: 'Progresso por Usuário',
  userProgressDesc: 'Acompanhe quantos fornecedores cada usuário deve avaliar e o progresso atual',
  noUserFound: 'Nenhum usuário encontrado para o filtro selecionado.',
  idUser: 'ID Usuário',
  ownersCol: 'Owners',
  suppliersCol: 'Fornecedores',
  evaluatedCol: 'Avaliados',
  pendingCol: 'Pendentes',
  progress: 'Progresso',
  averageCol: 'Média',

  loading: 'Carregando...',

  noSuppliersForUser: 'Nenhum fornecedor encontrado para este usuário.',
  noSuppliersMatchSearch: 'Nenhum fornecedor corresponde à pesquisa.',
  loadingSuppliers: 'Carregando fornecedores...',

  admins: 'Administradores',
  adminsDesc: 'Gerenciar quem tem acesso administrativo ao sistema',
  addAdmin: 'Adicionar Administrador',
  adminOidPlaceholder: 'Object ID do Entra (GUID)',
  adminDisplayName: 'Nome de exibição',
  adminDisplayNamePlaceholder: 'Nome da pessoa',
  addAdminButton: 'Autorizar',
  removeAdmin: 'Remover',
  removeAdminConfirm: 'Confirma a remoção deste administrador?',
  noAdminsRegistered: 'Nenhum administrador autorizado.',
  adminAdded: 'Administrador autorizado com sucesso.',
  adminRemoved: 'Administrador removido com sucesso.',
  adminAddError: 'Erro ao autorizar administrador.',
  adminRemoveError: 'Erro ao remover administrador.',
  cannotRemoveLastAdmin: 'Não é possível remover o último administrador ativo.',
  objectId: 'Object ID',
  authorizedBy: 'Autorizado por',
  authorizedAt: 'Autorizado em',
  auditLog: 'Auditoria de Administradores',
  auditLogDesc: 'Registro de concessões e revogações de acesso administrativo',
  noAuditEntries: 'Nenhuma entrada de auditoria.',
  auditAction: 'Ação',
  auditTarget: 'Alvo',
  auditActor: 'Autor',
  auditDate: 'Data',
  grant: 'Conceder',
  revoke: 'Revogar',
  selectExistingUser: 'Selecionar usuário existente',
  addByOid: 'Cadastrar por Object ID',
};

const en: Translation = {
  selectLanguage: 'Select language',

  appTitle: 'Scorecard Indirect Suppliers',
  appSubtitle: 'Supplier Performance Evaluation',
  loginTab: 'Login',
  firstAccessTab: 'First Access',
  userId: 'User ID',
  userIdPlaceholder: 'Enter your ID',
  email: 'Email',
  emailPlaceholder: 'Enter your email',
  password: 'Password',
  passwordPlaceholder: 'Enter your password',
  confirmPassword: 'Confirm Password',
  confirmPasswordPlaceholder: 'Confirm your password',
  loginButton: 'Sign In',
  registerButton: 'Register',
  signingIn: 'Signing in...',
  registering: 'Registering...',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  loginError: 'Invalid ID or password. Please check and try again.',
  entraDescription: 'Sign in with your Microsoft work account to access the system.',
  entraSignInButton: 'Sign in with Microsoft',
  entraError: 'Could not sign in with your Microsoft account. Please try again.',
  entraNotAuthorized: 'Your account does not have access to this system. Contact your administrator.',
  entraNotConfigured: 'Microsoft sign-in is not configured yet. Please contact support.',
  devModeButton: 'Sign in (dev mode)',
  firstAccessError: 'Could not register. Please check your details and try again.',
  idAlreadyRegistered: 'This ID is already registered in the system.',
  idNotFoundInSpreadsheet: 'This ID was not found in the imported spreadsheet.',
  passwordMismatch: 'Passwords do not match.',
  passwordTooShort: 'The password must be at least 8 characters long.',
  fillAllFields: 'Please fill in all fields.',
  invalidEmail: 'Invalid email.',
  adminAutoDetected: 'Administrator access detected.',

  cycle: 'Cycle',
  refresh: 'Refresh',
  admin: 'Admin',
  logout: 'Logout',

  totalSuppliers: 'Total Suppliers',
  evaluated: 'Evaluated',
  pending: 'Pending',
  generalAverage: 'General Average',
  approvalRate: 'Approval Rate',
  riskSuppliers: 'Risk Suppliers',
  consistency: 'Consistency',

  evaluationDistribution: 'Evaluation Distribution',
  cycleProgress: 'Cycle Progress',
  scoreByCriterion: 'Score by Criterion',
  evaluationTrend: 'Evaluation Trend',
  performanceByCommodity: 'Performance by Commodity',
  quality: 'Quality',
  delivery: 'Delivery',
  cost: 'Cost',
  completed: 'Completed',
  remaining: 'Remaining',
  accumulatedAverage: 'Accumulated Average',
  count: 'Count',

  pendingEvaluation: 'Pending Evaluation',
  evaluatedSuppliers: 'Evaluated Suppliers',
  noPendingSuppliers: 'No pending suppliers',
  allCaughtUp: 'All caught up! All suppliers have been evaluated.',
  searchPlaceholder: 'Search by company name or code...',
  allCommodities: 'All Commodities',
  allStatus: 'All statuses',
  statusAll: 'All',
  statusPending: 'Pending',
  statusEvaluated: 'Evaluated',
  sortBy: 'Sort by',
  sortCode: 'Code',
  sortOrders: 'Order Count',
  sortName: 'Name',
  sortStatus: 'Status',
  ascending: 'Ascending',
  descending: 'Descending',
  ord: 'ORD.',
  loc: 'Loc',
  owner: 'Owner',
  evaluate: 'Evaluate',
  evaluatedBtn: 'Evaluated',
  evaluatedBadge: 'Evaluated',
  pendingBadge: 'Pending',

  evaluationTitle: 'Supplier Evaluation',
  mandatoryAnswer: 'Mandatory answer',
  question1: 'Were the supplier delivery deadlines met as agreed?',
  question2: 'Was the supplier response time within an acceptable timeframe?',
  question3: 'Was the supplier product/service delivered with adequate quality?',
  ratingPoor: 'Poor',
  ratingGood: 'Good',
  ratingExcellent: 'Excellent',
  commentsOptional: 'Comments (optional)',
  commentsPlaceholder: 'Add observations about the supplier...',
  calculatedAverage: 'Calculated Average',
  answerAllQuestions: 'Please answer all 3 mandatory questions.',
  alreadyEvaluated: 'This supplier has already been evaluated in this cycle.',
  errorSaving: 'Error saving evaluation. Please try again.',
  cancel: 'Cancel',
  saveEvaluation: 'Save Evaluation',
  saving: 'Saving...',
  readyToSave: 'Ready to save',

  classificationPoor: 'Poor',
  classificationGood: 'Good',
  classificationExcellent: 'Excellent',

  back: 'Back',
  adminArea: 'Administrative Area',
  history: 'History',
  panel: 'Panel',
  import: 'Import',
  accesses: 'Accesses',
  importExcel: 'Import Excel Spreadsheet',
  importDescription: 'Select a .xlsx file. The import will replace the active base and generate a new evaluation cycle.',
  clickToSelect: 'Click to select a file',
  supportedFormats: 'Supported formats: .xlsx, .xls',
  recordsDetected: 'records detected',
  expectedColumns: 'Expected columns in the spreadsheet:',
  colLocEmb: 'Loc Emb',
  colNomeClas: 'Nome Clas',
  colCnpjCpf: 'CNPJ/CPF',
  colCommodities: 'Commodities',
  colIdUser: 'ID USER',
  colOwner: 'OWNER',
  noValidRecords: 'No valid records found. Check the spreadsheet columns.',
  errorReadingFile: 'Error reading file. Check if it is a valid Excel file (.xlsx).',
  importAndGenerate: 'Import and Generate New Cycle',
  importing: 'Importing...',
  importStepSuppliers: 'Importing suppliers',
  importStepOrders: 'Importing purchase orders',
  importSuccess: 'Import complete! Cycle {ciclo} created with {count} suppliers.',
  importError: 'Could not complete the import. Check the file and try again.',
  showing: 'Showing',
  of: 'of',
  records: 'records',

  accessHistory: 'Access History',
  accessHistoryDesc: 'Record of date and time of each access to the tool',
  noAccessRegistered: 'No access registered yet.',
  user: 'User',
  dateAndTime: 'Date and Time',

  importHistory: 'Import History',
  close: 'Close',
  noImportsRegistered: 'No imports registered.',
  file: 'File',
  date: 'Date',

  deleteAllData: 'Delete All Imported Data',
  deleteAllDataDesc: 'Permanently removes all purchase orders, imports, and evaluations across all cycles.',
  deleteAllConfirm: 'Confirm deletion of all imported data?',
  deleteAllWarning: 'This action is irreversible. All cycles, purchase orders, and evaluations will be removed.',
  confirm: 'Confirm',
  cancelDelete: 'Cancel',
  deleting: 'Deleting...',
  deleteSuccess: 'All imported data has been successfully deleted.',
  deleteError: 'Error deleting data. Please try again.',
  filterCycles: 'Filter Imported Cycles',
  filterCyclesDesc: 'Select a cycle to view its details or filter data by cycle.',
  noCyclesAvailable: 'No cycles available for filtering.',
  selectCycle: 'Select Cycle',
  allCycles: 'All Cycles',
  cycleLabel: 'Cycle',
  importDate: 'Import Date',
  fileName: 'File',
  orderCount: 'Orders',

  managementPanel: 'Strategic Management Panel',
  managementPanelDesc: 'Overview of cycle {ciclo} and complete history',
  loadingPanel: 'Loading panel data...',
  evaluations: 'Evaluations',
  pendingKpi: 'Pending',
  generalAverageKpi: 'General Average',
  approvalRateKpi: 'Approval Rate',
  riskIndex: 'Risk Index',
  consistencyKpi: 'Consistency',
  purchaseCoverage: 'Purchase Coverage',
  orders: 'orders',
  completedPct: 'completed',
  ofTotal: 'of total',
  evaluationsCount: 'evaluations',
  excellentSuppliers: 'excellent suppliers',
  riskSuppliersCount: 'risk suppliers',
  deviation: 'Deviation',
  uncoveredOrders: 'uncovered orders',
  activeFilter: 'Active filter:',
  clear: 'clear',

  riskMatrix: 'Risk Matrix',
  noEvaluationsForMatrix: 'No evaluations to display the risk matrix.',
  evaluationVolume: 'Evaluation Volume',
  averageScore: 'Average Score',
  ordersAxis: 'Orders',
  score: 'Score',
  evaluationsAxis: 'Evaluations',

  strategicSupplierView: 'Strategic Supplier View',
  strategicSupplierDesc: 'Distribution by performance tier and complete ranking of evaluated suppliers',
  tierExcellent: 'Excellent',
  tierGood: 'Good',
  tierPoor: 'Poor',
  tierNotEvaluated: 'Not Evaluated',
  strategicRanking: 'Strategic Supplier Ranking',
  evaluatedCount: 'evaluated',
  noSuppliersEvaluated: 'No suppliers evaluated yet.',
  position: '#',
  supplier: 'Supplier',
  commodity: 'Commodity',
  ownerCol: 'Owner',
  evaluationsCol: 'Evaluations',
  scoreCol: 'Score',

  allSuppliers: 'All Suppliers',
  allSuppliersDesc: '{shown} of {total} suppliers registered in the system',
  allCommoditiesFilter: 'All Commodities',
  allOwnersFilter: 'All Owners',
  previous: 'Previous',
  next: 'Next',

  commodityPerformance: 'Commodity Performance',
  commodityPerformanceDesc: 'Grouping of suppliers by commodity type',
  noCommodities: 'No commodities registered.',
  averageByCommodity: 'Average by Commodity',
  evaluationCoverage: 'Evaluation Coverage',
  noEvaluations: 'No evaluations',
  suppliersShort: 'suppl.',

  ownerPerformance: 'Owner Performance',
  ownerPerformanceDesc: 'Grouping of suppliers by responsible (OWNER)',
  noOwners: 'No owners registered.',
  averageByOwner: 'Average by Owner',

  cycleEvolution: 'Cycle Evolution',
  cycleEvolutionDesc: 'History of all imported evaluation cycles',
  noCycles: 'No cycles imported yet.',
  current: 'current',

  userProgress: 'Progress by User',
  userProgressDesc: 'Track how many suppliers each user must evaluate and current progress',
  noUserFound: 'No user found for the selected filter.',
  idUser: 'User ID',
  ownersCol: 'Owners',
  suppliersCol: 'Suppliers',
  evaluatedCol: 'Evaluated',
  pendingCol: 'Pending',
  progress: 'Progress',
  averageCol: 'Average',

  loading: 'Loading...',

  noSuppliersForUser: 'No suppliers found for this user.',
  noSuppliersMatchSearch: 'No suppliers match the search.',
  loadingSuppliers: 'Loading suppliers...',

  admins: 'Administrators',
  adminsDesc: 'Manage who has administrative access to the system',
  addAdmin: 'Add Administrator',
  adminOidPlaceholder: 'Entra Object ID (GUID)',
  adminDisplayName: 'Display name',
  adminDisplayNamePlaceholder: 'Person name',
  addAdminButton: 'Authorize',
  removeAdmin: 'Remove',
  removeAdminConfirm: 'Confirm removal of this administrator?',
  noAdminsRegistered: 'No administrators authorized.',
  adminAdded: 'Administrator authorized successfully.',
  adminRemoved: 'Administrator removed successfully.',
  adminAddError: 'Error authorizing administrator.',
  adminRemoveError: 'Error removing administrator.',
  cannotRemoveLastAdmin: 'Cannot remove the last active administrator.',
  objectId: 'Object ID',
  authorizedBy: 'Authorized by',
  authorizedAt: 'Authorized at',
  auditLog: 'Admin Audit Log',
  auditLogDesc: 'Record of admin access grants and revocations',
  noAuditEntries: 'No audit entries.',
  auditAction: 'Action',
  auditTarget: 'Target',
  auditActor: 'Actor',
  auditDate: 'Date',
  grant: 'Grant',
  revoke: 'Revoke',
  selectExistingUser: 'Select existing user',
  addByOid: 'Add by Object ID',
};

const pl: Translation = {
  selectLanguage: 'Wybierz język',

  appTitle: 'Scorecard Indirect Suppliers',
  appSubtitle: 'Ocena Wydajności Dostawców',
  loginTab: 'Logowanie',
  firstAccessTab: 'Pierwszy Dostęp',
  userId: 'ID Użytkownika',
  userIdPlaceholder: 'Wprowadź swoje ID',
  email: 'E-mail',
  emailPlaceholder: 'Wprowadź swój e-mail',
  password: 'Hasło',
  passwordPlaceholder: 'Wprowadź swoje hasło',
  confirmPassword: 'Potwierdź Hasło',
  confirmPasswordPlaceholder: 'Potwierdź swoje hasło',
  loginButton: 'Zaloguj się',
  registerButton: 'Zarejestruj',
  signingIn: 'Logowanie...',
  registering: 'Rejestracja...',
  showPassword: 'Pokaż hasło',
  hidePassword: 'Ukryj hasło',
  loginError: 'Nieprawidłowe ID lub hasło. Sprawdź i spróbuj ponownie.',
  entraDescription: 'Zaloguj się służbowym kontem Microsoft, aby uzyskać dostęp do systemu.',
  entraSignInButton: 'Zaloguj się kontem Microsoft',
  entraError: 'Nie udało się zalogować kontem Microsoft. Spróbuj ponownie.',
  entraNotAuthorized: 'Twoje konto nie ma dostępu do tego systemu. Skontaktuj się z administratorem.',
  entraNotConfigured: 'Logowanie Microsoft nie jest jeszcze skonfigurowane. Skontaktuj się z pomocą techniczną.',
  devModeButton: 'Zaloguj (tryb deweloperski)',
  firstAccessError: 'Nie udało się zarejestrować. Sprawdź dane i spróbuj ponownie.',
  idAlreadyRegistered: 'To ID jest już zarejestrowane w systemie.',
  idNotFoundInSpreadsheet: 'To ID nie zostało znalezione w zaimportowanym arkuszu.',
  passwordMismatch: 'Hasła nie są zgodne.',
  passwordTooShort: 'Hasło musi mieć co najmniej 8 znaków.',
  fillAllFields: 'Wypełnij wszystkie pola.',
  invalidEmail: 'Nieprawidłowy e-mail.',
  adminAutoDetected: 'Wykryto dostęp administratora.',

  cycle: 'Cykl',
  refresh: 'Odśwież',
  admin: 'Admin',
  logout: 'Wyloguj',

  totalSuppliers: 'Wszyscy Dostawcy',
  evaluated: 'Ocenieni',
  pending: 'Oczekujący',
  generalAverage: 'Średnia Ogólna',
  approvalRate: 'Wskaźnik Zatwierdzenia',
  riskSuppliers: 'Dostawcy Ryzyka',
  consistency: 'Spójność',

  evaluationDistribution: 'Rozkład Oceny',
  cycleProgress: 'Postęp Cyklu',
  scoreByCriterion: 'Wynik według Kryterium',
  evaluationTrend: 'Trend Oceny',
  performanceByCommodity: 'Wydajność według Towaru',
  quality: 'Jakość',
  delivery: 'Dostawa',
  cost: 'Koszt',
  completed: 'Zakończone',
  remaining: 'Pozostałe',
  accumulatedAverage: 'Średnia Skumulowana',
  count: 'Liczba',

  pendingEvaluation: 'Oczekujący na Ocenę',
  evaluatedSuppliers: 'Ocenieni Dostawcy',
  noPendingSuppliers: 'Brak dostawców oczekujących',
  allCaughtUp: 'Wszystko gotowe! Wszyscy dostawcy zostali ocenieni.',
  searchPlaceholder: 'Szukaj według nazwy lub kodu...',
  allCommodities: 'Wszystkie Towary',
  allStatus: 'Wszystkie statusy',
  statusAll: 'Wszystkie',
  statusPending: 'Oczekujący',
  statusEvaluated: 'Ocenieni',
  sortBy: 'Sortuj według',
  sortCode: 'Kod',
  sortOrders: 'Liczba Zamówień',
  sortName: 'Nazwa',
  sortStatus: 'Status',
  ascending: 'Rosnąco',
  descending: 'Malejąco',
  ord: 'ZAM.',
  loc: 'Loc',
  owner: 'Owner',
  evaluate: 'Oceń',
  evaluatedBtn: 'Oceniony',
  evaluatedBadge: 'Oceniony',
  pendingBadge: 'Oczekujący',

  evaluationTitle: 'Ocena Dostawcy',
  mandatoryAnswer: 'Obowiązkowa odpowiedź',
  question1: 'Czy terminy dostaw dostawcy były dotrzymane zgodnie z umową?',
  question2: 'Czy czas odpowiedzi dostawcy był w akceptowalnym czasie?',
  question3: 'Czy produkt/usługa dostawcy została dostarczona z odpowiednią jakością?',
  ratingPoor: 'Słaby',
  ratingGood: 'Dobry',
  ratingExcellent: 'Doskonały',
  commentsOptional: 'Komentarze (opcjonalnie)',
  commentsPlaceholder: 'Dodaj uwagi o dostawcy...',
  calculatedAverage: 'Obliczona Średnia',
  answerAllQuestions: 'Odpowiedz na wszystkie 3 obowiązkowe pytania.',
  alreadyEvaluated: 'Ten dostawca został już oceniony w tym cyklu.',
  errorSaving: 'Błąd podczas zapisywania oceny. Spróbuj ponownie.',
  cancel: 'Anuluj',
  saveEvaluation: 'Zapisz Ocenę',
  saving: 'Zapisywanie...',
  readyToSave: 'Gotowe do zapisu',

  classificationPoor: 'Słaby',
  classificationGood: 'Dobry',
  classificationExcellent: 'Doskonały',

  back: 'Wstecz',
  adminArea: 'Obszar Administracyjny',
  history: 'Historia',
  panel: 'Panel',
  import: 'Import',
  accesses: 'Dostęp',
  importExcel: 'Importuj Arkusz Excel',
  importDescription: 'Wybierz plik .xlsx. Import zastąpi aktywną bazę i wygeneruje nowy cykl oceny.',
  clickToSelect: 'Kliknij, aby wybrać plik',
  supportedFormats: 'Obsługiwane formaty: .xlsx, .xls',
  recordsDetected: 'wykrytych rekordów',
  expectedColumns: 'Oczekiwane kolumny w arkuszu:',
  colLocEmb: 'Loc Emb',
  colNomeClas: 'Nome Clas',
  colCnpjCpf: 'CNPJ/CPF',
  colCommodities: 'Commodities',
  colIdUser: 'ID USER',
  colOwner: 'OWNER',
  noValidRecords: 'Nie znaleziono prawidłowych rekordów. Sprawdź kolumny arkusza.',
  errorReadingFile: 'Błąd odczytu pliku. Sprawdź, czy jest prawidłowy plik Excel (.xlsx).',
  importAndGenerate: 'Importuj i Wygeneruj Nowy Cykl',
  importing: 'Importowanie...',
  importStepSuppliers: 'Importowanie dostawców',
  importStepOrders: 'Importowanie zamówień zakupu',
  importSuccess: 'Import zakończony! Cykl {ciclo} utworzony z {count} dostawcami.',
  importError: 'Nie udało się ukończyć importu. Sprawdź plik i spróbuj ponownie.',
  showing: 'Pokazuję',
  of: 'z',
  records: 'rekordów',

  accessHistory: 'Historia Dostępu',
  accessHistoryDesc: 'Rejestr daty i czasu każdego dostępu do narzędzia',
  noAccessRegistered: 'Brak zarejestrowanych dostępów.',
  user: 'Użytkownik',
  dateAndTime: 'Data i Czas',

  importHistory: 'Historia Importów',
  close: 'Zamknij',
  noImportsRegistered: 'Brak zarejestrowanych importów.',
  file: 'Plik',
  date: 'Data',

  deleteAllData: 'Usuń Wszystkie Zaimportowane Dane',
  deleteAllDataDesc: 'Trwale usuwa wszystkie zamówienia zakupu, importy i oceny we wszystkich cyklach.',
  deleteAllConfirm: 'Potwierdzić usunięcie wszystkich zaimportowanych danych?',
  deleteAllWarning: 'Ta akcja jest nieodwracalna. Wszystkie cykle, zamówienia zakupu i oceny zostaną usunięte.',
  confirm: 'Potwierdź',
  cancelDelete: 'Anuluj',
  deleting: 'Usuwanie...',
  deleteSuccess: 'Wszystkie zaimportowane dane zostały pomyślnie usunięte.',
  deleteError: 'Błąd podczas usuwania danych. Spróbuj ponownie.',
  filterCycles: 'Filtruj Zaimportowane Cykle',
  filterCyclesDesc: 'Wybierz cykl, aby wyświetlić jego szczegóły lub filtrować dane według cyklu.',
  noCyclesAvailable: 'Brak dostępnych cykli do filtrowania.',
  selectCycle: 'Wybierz Cykl',
  allCycles: 'Wszystkie Cykle',
  cycleLabel: 'Cykl',
  importDate: 'Data Importu',
  fileName: 'Plik',
  orderCount: 'Zamówienia',

  managementPanel: 'Panel Zarządzania Strategicznego',
  managementPanelDesc: 'Przegląd cyklu {ciclo} i pełna historia',
  loadingPanel: 'Ładowanie danych panelu...',
  evaluations: 'Oceny',
  pendingKpi: 'Oczekujący',
  generalAverageKpi: 'Średnia Ogólna',
  approvalRateKpi: 'Wskaźnik Zatwierdzenia',
  riskIndex: 'Wskaźnik Ryzyka',
  consistencyKpi: 'Spójność',
  purchaseCoverage: 'Pokrycie Zakupów',
  orders: 'zamówień',
  completedPct: 'zakończone',
  ofTotal: 'z ogółem',
  evaluationsCount: 'ocen',
  excellentSuppliers: 'doskonałych dostawców',
  riskSuppliersCount: 'dostawców ryzyka',
  deviation: 'Odchylenie',
  uncoveredOrders: 'niepokrytych zamówień',
  activeFilter: 'Aktywny filtr:',
  clear: 'wyczyść',

  riskMatrix: 'Macierz Ryzyka',
  noEvaluationsForMatrix: 'Brak ocen do wyświetlenia macierzy ryzyka.',
  evaluationVolume: 'Wolumen Oceny',
  averageScore: 'Średni Wynik',
  ordersAxis: 'Zamówienia',
  score: 'Wynik',
  evaluationsAxis: 'Oceny',

  strategicSupplierView: 'Strategiczny Widok Dostawców',
  strategicSupplierDesc: 'Rozkład według poziomu wydajności i pełny ranking ocenionych dostawców',
  tierExcellent: 'Doskonali',
  tierGood: 'Dobrzy',
  tierPoor: 'Słabi',
  tierNotEvaluated: 'Nieocenieni',
  strategicRanking: 'Strategiczny Ranking Dostawców',
  evaluatedCount: 'ocenionych',
  noSuppliersEvaluated: 'Brak ocenionych dostawców.',
  position: '#',
  supplier: 'Dostawca',
  commodity: 'Towar',
  ownerCol: 'Owner',
  evaluationsCol: 'Oceny',
  scoreCol: 'Wynik',

  allSuppliers: 'Wszyscy Dostawcy',
  allSuppliersDesc: '{shown} z {total} dostawców zarejestrowanych w systemie',
  allCommoditiesFilter: 'Wszystkie Towary',
  allOwnersFilter: 'Wszyscy Owner',
  previous: 'Poprzedni',
  next: 'Następny',

  commodityPerformance: 'Wydajność według Towaru',
  commodityPerformanceDesc: 'Grupowanie dostawców według typu towaru',
  noCommodities: 'Brak zarejestrowanych towarów.',
  averageByCommodity: 'Średnia według Towaru',
  evaluationCoverage: 'Pokrycie Oceny',
  noEvaluations: 'Brak ocen',
  suppliersShort: 'dost.',

  ownerPerformance: 'Wydajność według Owner',
  ownerPerformanceDesc: 'Grupowanie dostawców według odpowiedzialnego (OWNER)',
  noOwners: 'Brak zarejestrowanych owner.',
  averageByOwner: 'Średnia według Owner',

  cycleEvolution: 'Ewolucja Cyklu',
  cycleEvolutionDesc: 'Historia wszystkich zaimportowanych cykli oceny',
  noCycles: 'Brak zaimportowanych cykli.',
  current: 'obecny',

  userProgress: 'Postęp według Użytkownika',
  userProgressDesc: 'Śledź, ilu dostawców każdy użytkownik musi ocenić i aktualny postęp',
  noUserFound: 'Nie znaleziono użytkownika dla wybranego filtru.',
  idUser: 'ID Użytkownika',
  ownersCol: 'Owner',
  suppliersCol: 'Dostawcy',
  evaluatedCol: 'Ocenieni',
  pendingCol: 'Oczekujący',
  progress: 'Postęp',
  averageCol: 'Średnia',

  loading: 'Ładowanie...',

  noSuppliersForUser: 'Nie znaleziono dostawców dla tego użytkownika.',
  noSuppliersMatchSearch: 'Żaden dostawca nie pasuje do wyszukiwania.',
  loadingSuppliers: 'Ładowanie dostawców...',

  admins: 'Administratorzy',
  adminsDesc: 'Zarządzaj kto ma dostęp administracyjny do systemu',
  addAdmin: 'Dodaj Administratora',
  adminOidPlaceholder: 'Object ID Entra (GUID)',
  adminDisplayName: 'Nazwa wyświetlana',
  adminDisplayNamePlaceholder: 'Imię osoby',
  addAdminButton: 'Autoryzuj',
  removeAdmin: 'Usuń',
  removeAdminConfirm: 'Potwierdzasz usunięcie tego administratora?',
  noAdminsRegistered: 'Brak autoryzowanych administratorów.',
  adminAdded: 'Administrator autoryzowany pomyślnie.',
  adminRemoved: 'Administrator usunięty pomyślnie.',
  adminAddError: 'Błąd autoryzacji administratora.',
  adminRemoveError: 'Błąd usuwania administratora.',
  cannotRemoveLastAdmin: 'Nie można usunąć ostatniego aktywnego administratora.',
  objectId: 'Object ID',
  authorizedBy: 'Autoryzowany przez',
  authorizedAt: 'Autoryzowany w',
  auditLog: 'Dziennik Audytu Administratorów',
  auditLogDesc: 'Rejestr nadawania i odbierania dostępu administracyjnego',
  noAuditEntries: 'Brak wpisów audytu.',
  auditAction: 'Akcja',
  auditTarget: 'Cel',
  auditActor: 'Autor',
  auditDate: 'Data',
  grant: 'Nadaj',
  revoke: 'Cofnij',
  selectExistingUser: 'Wybierz istniejącego użytkownika',
  addByOid: 'Dodaj przez Object ID',
};

const es: Translation = {
  selectLanguage: 'Seleccione el idioma',

  appTitle: 'Scorecard Indirect Suppliers',
  appSubtitle: 'Evaluación de Desempeño de Proveedores',
  loginTab: 'Inicio de Sesión',
  firstAccessTab: 'Primer Acceso',
  userId: 'ID de Usuario',
  userIdPlaceholder: 'Ingrese su ID',
  email: 'Correo Electrónico',
  emailPlaceholder: 'Ingrese su correo',
  password: 'Contraseña',
  passwordPlaceholder: 'Ingrese su contraseña',
  confirmPassword: 'Confirmar Contraseña',
  confirmPasswordPlaceholder: 'Confirme su contraseña',
  loginButton: 'Iniciar Sesión',
  registerButton: 'Registrar',
  signingIn: 'Iniciando sesión...',
  registering: 'Registrando...',
  showPassword: 'Mostrar contraseña',
  hidePassword: 'Ocultar contraseña',
  loginError: 'ID o contraseña inválidos. Verifique e intente nuevamente.',
  entraDescription: 'Inicie sesión con su cuenta corporativa de Microsoft para acceder al sistema.',
  entraSignInButton: 'Iniciar sesión con Microsoft',
  entraError: 'No se pudo iniciar sesión con su cuenta de Microsoft. Intente nuevamente.',
  entraNotAuthorized: 'Su cuenta no tiene acceso a este sistema. Contacte al administrador.',
  entraNotConfigured: 'El acceso con Microsoft aún no está configurado. Contacte al soporte.',
  devModeButton: 'Iniciar sesión (modo desarrollo)',
  firstAccessError: 'No se pudo registrar. Verifique los datos e intente nuevamente.',
  idAlreadyRegistered: 'Este ID ya está registrado en el sistema.',
  idNotFoundInSpreadsheet: 'Este ID no se encontró en la hoja importada.',
  passwordMismatch: 'Las contraseñas no coinciden.',
  passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.',
  fillAllFields: 'Complete todos los campos.',
  invalidEmail: 'Correo electrónico inválido.',
  adminAutoDetected: 'Acceso de administrador detectado.',

  cycle: 'Ciclo',
  refresh: 'Actualizar',
  admin: 'Admin',
  logout: 'Salir',

  totalSuppliers: 'Total Proveedores',
  evaluated: 'Evaluados',
  pending: 'Pendientes',
  generalAverage: 'Promedio General',
  approvalRate: 'Tasa de Aprobación',
  riskSuppliers: 'Proveedores de Riesgo',
  consistency: 'Consistencia',

  evaluationDistribution: 'Distribución de Evaluaciones',
  cycleProgress: 'Progreso del Ciclo',
  scoreByCriterion: 'Puntuación por Criterio',
  evaluationTrend: 'Tendencia de Evaluaciones',
  performanceByCommodity: 'Desempeño por Commodity',
  quality: 'Calidad',
  delivery: 'Entrega',
  cost: 'Costo',
  completed: 'Completado',
  remaining: 'Restante',
  accumulatedAverage: 'Promedio Acumulado',
  count: 'Conteo',

  pendingEvaluation: 'Pendientes de Evaluación',
  evaluatedSuppliers: 'Proveedores Evaluados',
  noPendingSuppliers: 'Ningún proveedor pendiente',
  allCaughtUp: '¡Todo al día! Todos los proveedores han sido evaluados.',
  searchPlaceholder: 'Buscar por razón social o código...',
  allCommodities: 'Todas las Commodities',
  allStatus: 'Todos los estados',
  statusAll: 'Todos',
  statusPending: 'Pendientes',
  statusEvaluated: 'Evaluados',
  sortBy: 'Ordenar por',
  sortCode: 'Código',
  sortOrders: 'Cant. Órdenes',
  sortName: 'Nombre',
  sortStatus: 'Estado',
  ascending: 'Ascendente',
  descending: 'Descendente',
  ord: 'ORD.',
  loc: 'Loc',
  owner: 'Owner',
  evaluate: 'Evaluar',
  evaluatedBtn: 'Evaluado',
  evaluatedBadge: 'Evaluado',
  pendingBadge: 'Pendiente',

  evaluationTitle: 'Evaluación de Proveedor',
  mandatoryAnswer: 'Respuesta obligatoria',
  question1: '¿Los plazos de entrega del proveedor estuvieron dentro del plazo acordado?',
  question2: '¿El tiempo de respuesta del proveedor estuvo dentro de un plazo aceptable?',
  question3: '¿El producto/servicio del proveedor fue entregado con la calidad adecuada?',
  ratingPoor: 'Malo',
  ratingGood: 'Bueno',
  ratingExcellent: 'Excelente',
  commentsOptional: 'Comentarios (opcional)',
  commentsPlaceholder: 'Agregue observaciones sobre el proveedor...',
  calculatedAverage: 'Promedio Calculado',
  answerAllQuestions: 'Responda las 3 preguntas obligatorias.',
  alreadyEvaluated: 'Este proveedor ya fue evaluado en este ciclo.',
  errorSaving: 'Error al guardar la evaluación. Intente nuevamente.',
  cancel: 'Cancelar',
  saveEvaluation: 'Guardar Evaluación',
  saving: 'Guardando...',
  readyToSave: 'Listo para guardar',

  classificationPoor: 'Malo',
  classificationGood: 'Bueno',
  classificationExcellent: 'Excelente',

  back: 'Volver',
  adminArea: 'Área Administrativa',
  history: 'Historial',
  panel: 'Panel',
  import: 'Importar',
  accesses: 'Accesos',
  importExcel: 'Importar Hoja de Excel',
  importDescription: 'Seleccione un archivo .xlsx. La importación reemplazará la base activa y generará un nuevo ciclo de evaluación.',
  clickToSelect: 'Haga clic para seleccionar un archivo',
  supportedFormats: 'Formatos soportados: .xlsx, .xls',
  recordsDetected: 'registros detectados',
  expectedColumns: 'Columnas esperadas en la hoja:',
  colLocEmb: 'Loc Emb',
  colNomeClas: 'Nombre Clas',
  colCnpjCpf: 'CNPJ/CPF',
  colCommodities: 'Commodities',
  colIdUser: 'ID USER',
  colOwner: 'OWNER',
  noValidRecords: 'No se encontraron registros válidos. Verifique las columnas de la hoja.',
  errorReadingFile: 'Error al leer el archivo. Verifique si es un Excel válido (.xlsx).',
  importAndGenerate: 'Importar y Generar Nuevo Ciclo',
  importing: 'Importando...',
  importSuccess: '¡Importación completada! Ciclo {ciclo} creado con {count} proveedores.',
  importError: 'No se pudo completar la importación. Verifique el archivo e intente nuevamente.',
  showing: 'Mostrando',
  of: 'de',
  records: 'registros',

  accessHistory: 'Historial de Accesos',
  accessHistoryDesc: 'Registro de fecha y hora de cada acceso a la herramienta',
  noAccessRegistered: 'Ningún acceso registrado aún.',
  user: 'Usuario',
  dateAndTime: 'Fecha y Hora',

  importHistory: 'Historial de Importaciones',
  close: 'Cerrar',
  noImportsRegistered: 'Ninguna importación registrada.',
  file: 'Archivo',
  date: 'Fecha',

  deleteAllData: 'Eliminar Todos los Datos Importados',
  deleteAllDataDesc: 'Elimina permanentemente todas las órdenes de compra, importaciones y evaluaciones de todos los ciclos.',
  deleteAllConfirm: '¿Confirmar la eliminación de todos los datos importados?',
  deleteAllWarning: 'Esta acción es irreversible. Todos los ciclos, órdenes de compra y evaluaciones serán eliminados.',
  confirm: 'Confirmar',
  cancelDelete: 'Cancelar',
  deleting: 'Eliminando...',
  deleteSuccess: 'Todos los datos importados han sido eliminados exitosamente.',
  deleteError: 'Error al eliminar los datos. Intente nuevamente.',
  importStepSuppliers: 'Importando proveedores',
  importStepOrders: 'Importando órdenes de compra',
  filterCycles: 'Filtrar Ciclos Importados',
  filterCyclesDesc: 'Seleccione un ciclo para ver sus detalles o filtrar los datos por ciclo.',
  noCyclesAvailable: 'Ningún ciclo disponible para filtrar.',
  selectCycle: 'Seleccionar Ciclo',
  allCycles: 'Todos los Ciclos',
  cycleLabel: 'Ciclo',
  importDate: 'Fecha de Importación',
  fileName: 'Archivo',
  orderCount: 'Órdenes',

  managementPanel: 'Panel de Gestión Estratégica',
  managementPanelDesc: 'Vista general del ciclo {ciclo} e historial completo',
  loadingPanel: 'Cargando datos del panel...',
  evaluations: 'Evaluaciones',
  pendingKpi: 'Pendientes',
  generalAverageKpi: 'Promedio General',
  approvalRateKpi: 'Tasa de Aprobación',
  riskIndex: 'Índice de Riesgo',
  consistencyKpi: 'Consistencia',
  purchaseCoverage: 'Cobertura de Compras',
  orders: 'órdenes',
  completedPct: 'completado',
  ofTotal: 'del total',
  evaluationsCount: 'evaluaciones',
  excellentSuppliers: 'proveedores excelentes',
  riskSuppliersCount: 'proveedores de riesgo',
  deviation: 'Desviación',
  uncoveredOrders: 'órdenes no cubiertas',
  activeFilter: 'Filtro activo:',
  clear: 'limpiar',

  riskMatrix: 'Matriz de Riesgo',
  noEvaluationsForMatrix: 'Sin evaluaciones para mostrar la matriz de riesgo.',
  evaluationVolume: 'Volumen de Evaluaciones',
  averageScore: 'Puntuación Media',
  ordersAxis: 'Órdenes',
  score: 'Puntuación',
  evaluationsAxis: 'Evaluaciones',

  strategicSupplierView: 'Vista Estratégica de Proveedores',
  strategicSupplierDesc: 'Distribución por nivel de desempeño y ranking completo de proveedores evaluados',
  tierExcellent: 'Excelentes',
  tierGood: 'Buenos',
  tierPoor: 'Malos',
  tierNotEvaluated: 'No Evaluados',
  strategicRanking: 'Ranking Estratégico de Proveedores',
  evaluatedCount: 'evaluados',
  noSuppliersEvaluated: 'Ningún proveedor evaluado aún.',
  position: '#',
  supplier: 'Proveedor',
  commodity: 'Commodity',
  ownerCol: 'Owner',
  evaluationsCol: 'Evaluaciones',
  scoreCol: 'Puntuación',

  allSuppliers: 'Todos los Proveedores',
  allSuppliersDesc: '{shown} de {total} proveedores registrados en el sistema',
  allCommoditiesFilter: 'Todas las Commodities',
  allOwnersFilter: 'Todos los Owners',
  previous: 'Anterior',
  next: 'Siguiente',

  commodityPerformance: 'Desempeño por Commodity',
  commodityPerformanceDesc: 'Agrupación de proveedores por tipo de commodity',
  noCommodities: 'Ninguna commodity registrada.',
  averageByCommodity: 'Promedio por Commodity',
  evaluationCoverage: 'Cobertura de Evaluaciones',
  noEvaluations: 'Sin evaluaciones',
  suppliersShort: 'prov.',

  ownerPerformance: 'Desempeño por Owner',
  ownerPerformanceDesc: 'Agrupación de proveedores por responsable (OWNER)',
  noOwners: 'Ningún owner registrado.',
  averageByOwner: 'Promedio por Owner',

  cycleEvolution: 'Evolución por Ciclo',
  cycleEvolutionDesc: 'Historial de todos los ciclos de evaluación importados',
  noCycles: 'Ningún ciclo importado aún.',
  current: 'actual',

  userProgress: 'Progreso por Usuario',
  userProgressDesc: 'Seguimiento de cuántos proveedores debe evaluar cada usuario y el progreso actual',
  noUserFound: 'Ningún usuario encontrado para el filtro seleccionado.',
  idUser: 'ID Usuario',
  ownersCol: 'Owners',
  suppliersCol: 'Proveedores',
  evaluatedCol: 'Evaluados',
  pendingCol: 'Pendientes',
  progress: 'Progreso',
  averageCol: 'Promedio',

  loading: 'Cargando...',

  noSuppliersForUser: 'No se encontraron proveedores para este usuario.',
  noSuppliersMatchSearch: 'Ningún proveedor coincide con la búsqueda.',
  loadingSuppliers: 'Cargando proveedores...',

  admins: 'Administradores',
  adminsDesc: 'Gestionar quién tiene acceso administrativo al sistema',
  addAdmin: 'Añadir Administrador',
  adminOidPlaceholder: 'Object ID de Entra (GUID)',
  adminDisplayName: 'Nombre para mostrar',
  adminDisplayNamePlaceholder: 'Nombre de la persona',
  addAdminButton: 'Autorizar',
  removeAdmin: 'Eliminar',
  removeAdminConfirm: '¿Confirma la eliminación de este administrador?',
  noAdminsRegistered: 'Ningún administrador autorizado.',
  adminAdded: 'Administrador autorizado correctamente.',
  adminRemoved: 'Administrador eliminado correctamente.',
  adminAddError: 'Error al autorizar administrador.',
  adminRemoveError: 'Error al eliminar administrador.',
  cannotRemoveLastAdmin: 'No se puede eliminar el último administrador activo.',
  objectId: 'Object ID',
  authorizedBy: 'Autorizado por',
  authorizedAt: 'Autorizado el',
  auditLog: 'Auditoría de Administradores',
  auditLogDesc: 'Registro de concesiones y revocaciones de acceso administrativo',
  noAuditEntries: 'Ninguna entrada de auditoría.',
  auditAction: 'Acción',
  auditTarget: 'Objetivo',
  auditActor: 'Autor',
  auditDate: 'Fecha',
  grant: 'Conceder',
  revoke: 'Revocar',
  selectExistingUser: 'Seleccionar usuario existente',
  addByOid: 'Añadir por Object ID',
};

export const translations: Record<LanguageCode, Translation> = { pt, en, pl, es };

export function getLocale(code: LanguageCode): string {
  switch (code) {
    case 'pt': return 'pt-BR';
    case 'en': return 'en-US';
    case 'pl': return 'pl-PL';
    case 'es': return 'es-ES';
  }
}
