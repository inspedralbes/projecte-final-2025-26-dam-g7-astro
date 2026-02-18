<template>
    <v-container fluid class="fill-height plans-container d-flex align-center justify-center pa-0">
        
        <!-- SECTION 1: SELECT PLAN -->
        <v-container v-if="step === 'select-plan'" class="text-center py-10 fill-height d-flex flex-column justify-center">
            <div class="header-section mb-10">
                <h1 class="text-h2 font-weight-bold text-white mb-2 tracking-wide text-glow">
                    ASTRO <span class="text-primary">PROJECT</span>
                </h1>
                <p class="text-h6 text-grey-lighten-1 font-weight-light">
                    SELECCIONA TU MODO DE MISIÓN
                </p>
            </div>

            <v-row justify="center" align="stretch" class="plans-row">
                <v-col cols="12" md="5" lg="4" v-for="plan in plans" :key="plan.id" class="d-flex justify-center position-relative">
                    
                    <!-- DEFAULT / RECOMMENDED BADGE -->
                    <div v-if="plan.recommended" class="recommended-badge text-caption font-weight-bold">
                        ESTÁNDAR
                    </div>

                    <v-card
                        class="plan-card d-flex flex-column align-center justify-space-between w-100 pa-8 ma-2"
                        :class="[plan.id === 'INDIVIDUAL' ? 'plan-individual' : 'plan-grupal', { 'recommended-card': plan.recommended }]"
                        elevation="10"
                        rounded="xl"
                    >
                        <div class="icon-wrapper mb-6 mt-4">
                            <v-icon size="80" :color="plan.color" class="plan-icon">
                                {{ plan.icon }}
                            </v-icon>
                            <div class="icon-glow" :style="`background: ${plan.glowColor}`"></div>
                        </div>

                        <h2 class="text-h4 font-weight-bold mb-4 text-uppercase tracking-wider text-white">
                            {{ plan.id }}
                        </h2>

                        <v-divider class="mb-6 w-50" :color="plan.color" thickness="2"></v-divider>

                        <p class="text-body-1 text-grey-lighten-2 mb-8 plan-desc">
                            {{ plan.desc }}
                        </p>

                        <v-btn
                            block
                            :color="plan.color"
                            :variant="plan.recommended ? 'flat' : 'outlined'"
                            class="plan-btn mt-auto font-weight-bold"
                            rounded="lg"
                            @click="selectPlan(plan.id)"
                        >
                            {{ plan.recommended ? 'SELECCIONAR' : 'SELECCIONAR' }}
                        </v-btn>
                    </v-card>
                </v-col>
            </v-row>

            <div class="mt-8">
                <v-btn
                    variant="text"
                    color="grey-lighten-1"
                    prepend-icon="mdi-arrow-left"
                    @click="router.push('/profile')"
                    class="hover-bright text-caption"
                >
                    VOLVER AL PERFIL
                </v-btn>
            </div>
        </v-container>

        <!-- SECTION 2: GROUP OPTIONS (Create vs Join) -->
        <v-container v-else-if="step === 'group-options'" class="text-center py-10 fill-height d-flex flex-column justify-center">
            <div class="header-section mb-10">
                <v-icon size="60" color="purple-accent-2" class="mb-4 text-glow">mdi-account-group</v-icon>
                <h2 class="text-h3 font-weight-bold text-white mb-2 tracking-wide text-glow">
                    PROTOCOLO DE ESCUADRA
                </h2>
                <p class="text-h6 text-grey-lighten-1 font-weight-light">
                    ¿Cuál es tu estatus de misión?
                </p>
            </div>

            <v-row justify="center" align="stretch" class="plans-row">
                <!-- Option: Create Group -->
                <v-col cols="12" md="5" lg="4" class="d-flex justify-center">
                    <v-card
                        class="plan-card d-flex flex-column align-center justify-center w-100 pa-8 ma-2 plan-grupal"
                        @click="step = 'create-group'"
                        elevation="10"
                        rounded="xl"
                    >
                        <div class="icon-wrapper mb-6">
                            <v-icon size="70" color="green-accent-3" class="plan-icon">mdi-flag-plus</v-icon>
                            <div class="icon-glow" style="background: #00e676"></div>
                        </div>
                        <h2 class="text-h4 font-weight-bold text-uppercase tracking-wider text-white">
                            FUNDAR ESCUADRA
                        </h2>
                        <p class="text-body-1 text-grey-lighten-2 mt-4">
                            Crea un nuevo equipo y lidera la misión.
                        </p>
                    </v-card>
                </v-col>

                <!-- Option: Join Group -->
                <v-col cols="12" md="5" lg="4" class="d-flex justify-center">
                    <v-card
                        class="plan-card d-flex flex-column align-center justify-center w-100 pa-8 ma-2 plan-grupal"
                        @click="step = 'login'"
                        elevation="10"
                        rounded="xl"
                    >
                        <div class="icon-wrapper mb-6">
                            <v-icon size="70" color="purple-accent-2" class="plan-icon">mdi-account-arrow-right</v-icon>
                            <div class="icon-glow" style="background: #e040fb"></div>
                        </div>
                        <h2 class="text-h4 font-weight-bold text-uppercase tracking-wider text-white">
                            UNIRSE A ESCUADRA
                        </h2>
                        <p class="text-body-1 text-grey-lighten-2 mt-4">
                            Ingresa credenciales para unirte a un equipo existente.
                        </p>
                    </v-card>
                </v-col>
            </v-row>

            <div class="mt-8">
                <v-btn
                    variant="text"
                    color="grey-lighten-1"
                    prepend-icon="mdi-arrow-left"
                    @click="step = 'select-plan'"
                    class="hover-bright"
                >
                    VOLVER A SELECCIÓN
                </v-btn>
            </div>
        </v-container>

        <!-- SECTION 3A: JOIN GROUP (Login) -->
        <v-container v-else-if="step === 'login'" class="d-flex align-center justify-center fill-height" max-width="600">
            <v-card class="holo-panel pa-10 text-center w-100" rounded="xl" border>
                <div class="header-section mb-6">
                    <div class="d-flex align-center justify-center mb-4">
                        <v-icon size="40" color="purple-accent-2" class="mr-3 glass-icon">mdi-radar</v-icon>
                        <div class="text-overline text-purple-accent-1 tracking-widest">SISTEMA DE ENLACE</div>
                    </div>
                    <h2 class="text-h4 font-weight-black text-white mb-1 tracking-wide">ACCESO DE EQUIPO</h2>
                    <v-divider class="my-4 border-purple-glow"></v-divider>
                </div>

                <v-row dense>
                    <v-col cols="12" class="text-left mb-1">
                        <label class="text-caption text-purple-lighten-4 font-weight-bold ml-1">IDENTIFICADOR DE MISIÓN</label>
                    </v-col>
                    <v-col cols="12" class="mb-4">
                        <v-text-field
                            placeholder="NOMBRE DE ESCUADRA / ID"
                            variant="solo-filled"
                            bg-color="rgba(20, 10, 40, 0.6)"
                            color="purple-accent-2"
                            prepend-inner-icon="mdi-account-group"
                            v-model="user"
                            @keyup.enter="login"
                            class="tech-input"
                            hide-details
                        ></v-text-field>
                    </v-col>

                    <v-col cols="12" class="text-left mb-1">
                        <label class="text-caption text-purple-lighten-4 font-weight-bold ml-1">CLAVE DE ENCRIPTACIÓN</label>
                    </v-col>
                    <v-col cols="12" class="mb-6">
                        <v-text-field
                            placeholder="CÓDIGO DE ACCESO"
                            type="password"
                            variant="solo-filled"
                            bg-color="rgba(20, 10, 40, 0.6)"
                            color="purple-accent-2"
                            prepend-inner-icon="mdi-lock-outline"
                            v-model="password"
                            @keyup.enter="login"
                            class="tech-input"
                            hide-details
                        ></v-text-field>
                    </v-col>
                </v-row>

                <v-btn
                    block
                    height="64"
                    color="purple-accent-2"
                    @click="login"
                    :disabled="!user || !password"
                    class="mb-6 font-weight-bold glow-btn-secondary text-h6"
                    rounded="lg"
                >
                    <v-icon start class="mr-2">mdi-connection</v-icon>
                    ESTABLECER CONEXIÓN
                </v-btn>

                <v-btn
                    variant="text"
                    color="grey-lighten-2"
                    prepend-icon="mdi-arrow-left"
                    @click="step = 'group-options'"
                    class="hover-bright text-caption"
                >
                    ABORTAR Y VOLVER
                </v-btn>
            </v-card>
        </v-container>

        <!-- SECTION 3B: CREATE GROUP (New Form) -->
        <v-container v-else-if="step === 'create-group'" class="d-flex align-center justify-center fill-height" max-width="600">
            <v-card class="holo-panel pa-10 text-center w-100" rounded="xl" border>
                <div class="header-section mb-6">
                    <div class="d-flex align-center justify-center mb-4">
                        <v-icon size="40" color="green-accent-3" class="mr-3 glass-icon">mdi-domain-plus</v-icon>
                        <div class="text-overline text-green-accent-1 tracking-widest">REGISTRO DE UNIDAD</div>
                    </div>
                    <h2 class="text-h4 font-weight-black text-white mb-1 tracking-wide">NUEVA ESCUADRA</h2>
                    <v-divider class="my-4 border-green-glow"></v-divider>
                </div>

                <v-row dense>
                    <v-col cols="12" class="text-left mb-1">
                        <label class="text-caption text-green-lighten-4 font-weight-bold ml-1">DESIGNACIÓN DE UNIDAD</label>
                    </v-col>
                    <v-col cols="12" class="mb-4">
                        <v-text-field
                            placeholder="NOMBRE DE LA ESCUADRA"
                            variant="solo-filled"
                            bg-color="rgba(10, 30, 20, 0.6)"
                            color="green-accent-3"
                            prepend-inner-icon="mdi-format-title"
                            v-model="newGroupName"
                            class="tech-input-green"
                            hide-details
                        ></v-text-field>
                    </v-col>

                    <v-col cols="12" class="text-left mb-1">
                        <label class="text-caption text-green-lighten-4 font-weight-bold ml-1">PROTOCOLOS DE SEGURIDAD</label>
                    </v-col>
                    <v-col cols="12" sm="6" class="mb-1">
                        <v-text-field
                            placeholder="CONTRASEÑA"
                            type="password"
                            variant="solo-filled"
                            bg-color="rgba(10, 30, 20, 0.6)"
                            color="green-accent-3"
                            prepend-inner-icon="mdi-key-plus"
                            v-model="newGroupPassword"
                            class="tech-input-green"
                            hide-details
                        ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" class="mb-6">
                        <v-text-field
                            placeholder="REPETIR CÓDIGO"
                            type="password"
                            variant="solo-filled"
                            bg-color="rgba(10, 30, 20, 0.6)"
                            color="green-accent-3"
                            prepend-inner-icon="mdi-key-check"
                            v-model="newGroupPasswordConfirm"
                            class="tech-input-green"
                            :error-messages="newGroupPassword !== newGroupPasswordConfirm ? '!' : ''"
                            hide-details
                        ></v-text-field>
                    </v-col>
                </v-row>

                <v-btn
                    block
                    height="64"
                    color="green-accent-3"
                    @click="createGroup"
                    :disabled="!newGroupName || !newGroupPassword || newGroupPassword !== newGroupPasswordConfirm"
                    class="mb-6 font-weight-bold glow-btn-success text-h6 text-black"
                    rounded="lg"
                >
                    <v-icon start class="mr-2">mdi-check-decagram</v-icon>
                    CONFIRMAR FUNDACIÓN
                </v-btn>

                <v-btn
                    variant="text"
                    color="grey-lighten-2"
                    prepend-icon="mdi-arrow-left"
                    @click="step = 'group-options'"
                    class="hover-bright text-caption"
                >
                    CANCELAR PROTOCOLO
                </v-btn>
            </v-card>
        </v-container>

    </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useAstroStore } from '@/stores/astroStore'
import { useRouter } from 'vue-router'

const astroStore = useAstroStore()
const router = useRouter()

const step = ref('select-plan')
const selectedPlan = ref('')

// Login Data
const user = ref('')
const password = ref('')

// Registration Data (Group)
const newGroupName = ref('')
const newGroupPassword = ref('')
const newGroupPasswordConfirm = ref('')

const plans = [
    { 
        id: 'INDIVIDUAL', 
        icon: 'mdi-rocket-launch', 
        color: 'cyan-accent-3', 
        glowColor: 'cyan',
        desc: 'Despega en solitario. Domina las misiones básicas y explora el cosmos a tu propio ritmo.',
        recommended: true
    },
    { 
        id: 'GRUPAL', 
        icon: 'mdi-account-group-outline', 
        color: 'purple-accent-2', 
        glowColor: 'purple',
        desc: 'Únete a una escuadra. Coordinación táctica, seguimiento en tiempo real y panel de telemetría conjunto.',
        recommended: false
    }
]

const selectPlan = (planId) => {
    if (planId === 'INDIVIDUAL') {
        router.push('/profile')
        return
    }
    selectedPlan.value = planId
    
    // Si es grupal, vamos al paso intermedio de opciones
    if (planId === 'GRUPAL') {
        step.value = 'group-options'
    }
}

const login = async () => {
    if (!user.value || !password.value) return

    const result = await astroStore.loginTripulante({
        user: user.value,
        password: password.value
    })

    if (result.success) {
        router.push('/multiplayer') // Asumimos que si entra por grupo, va al multi
    } else {
        alert(result.message)
    }
}

const createGroup = async () => {
    if (!newGroupName.value || !newGroupPassword.value) return
    
    // Aquí iría la lógica para crear el grupo en el backend
    // Por ahora simulamos éxito y redirigimos
    console.log("Creando grupo:", newGroupName.value)
    
    // Simulación de éxito
    alert(`Escuadra "${newGroupName.value}" fundada con éxito. Protocolo iniciado.`)
    router.push('/multiplayer')
}
</script>

<style scoped>
/* BACKGROUND ANIMATION */
.plans-container {
    background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%);
    position: relative;
    overflow: hidden;
    z-index: 1;
}

.plans-container::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: 
        radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 3px),
        radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 2px),
        radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 3px);
    background-size: 550px 550px, 350px 350px, 250px 250px;
    background-position: 0 0, 40px 60px, 130px 270px;
    opacity: 0.3;
    animation: stars 120s linear infinite;
    z-index: -1;
}

@keyframes stars {
    from { transform: translateY(0); }
    to { transform: translateY(-1000px); }
}

/* TEXT STYLES */
.text-glow {
    text-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
}

.tracking-wide { letter-spacing: 2px; }
.tracking-wider { letter-spacing: 3px; }
.tracking-widest { letter-spacing: 4px; }

/* CARD STYLES */
.plan-card {
    background: rgba(20, 25, 40, 0.7) !important;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08); /* Fallback */
    cursor: default;
    overflow: hidden;
    position: relative;
}

.plan-card::after {
    content: "";
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%);
    pointer-events: none;
}


/* RECOMMENDED / INDIVIDUAL */
.recommended-badge {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #00e5ff;
    color: black;
    padding: 6px 16px;
    border-radius: 20px;
    z-index: 20;
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.6);
    border: 2px solid white;
}

.recommended-card {
    border: 2px solid rgba(0, 229, 255, 0.3) !important;
    background: rgba(0, 40, 60, 0.6) !important;
}

.plan-individual .plan-icon {
    filter: drop-shadow(0 0 15px rgba(0, 229, 255, 0.5));
}

/* GRUPAL PLAN SPECIFIC */
.plan-grupal .plan-icon {
    filter: drop-shadow(0 0 15px rgba(224, 64, 251, 0.5));
}

/* ICON GLOW */
.icon-wrapper {
    position: relative;
    display: inline-block;
}

.icon-glow {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 80px; height: 80px;
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.2;
}


/* BUTTON STYLES */
.plan-btn {
    border-width: 2px;
    text-transform: none;
    letter-spacing: 1px;
}


/* HOLO PANEL STYLES (NEW FORMS) */
.holo-panel {
    background: rgba(10, 15, 25, 0.9) !important;
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.08); /* Fallback */
    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
}

.border-purple-glow {
    border-color: rgba(224, 64, 251, 0.5) !important;
    opacity: 1;
    box-shadow: 0 0 10px rgba(224, 64, 251, 0.3);
}

.border-green-glow {
    border-color: rgba(0, 230, 118, 0.5) !important;
    opacity: 1;
    box-shadow: 0 0 10px rgba(0, 230, 118, 0.3);
}

/* TECH INPUTS */
.tech-input :deep(.v-field) {
    border-radius: 0 16px 0 16px !important; /* Tech shape */
    border: 1px solid rgba(224, 64, 251, 0.3);
    transition: all 0.3s;
}

.tech-input :deep(.v-field:hover), .tech-input :deep(.v-field--focused) {
    border-color: #e040fb;
    box-shadow: 0 0 15px rgba(224, 64, 251, 0.2);
}

.tech-input-green :deep(.v-field) {
    border-radius: 16px 0 16px 0 !important; /* Tech shape alternate */
    border: 1px solid rgba(0, 230, 118, 0.3);
    transition: all 0.3s;
}

.tech-input-green :deep(.v-field:hover), .tech-input-green :deep(.v-field--focused) {
    border-color: #00e676;
    box-shadow: 0 0 15px rgba(0, 230, 118, 0.2);
}

.tech-input :deep(input), .tech-input-green :deep(input) {
    font-family: 'Courier New', monospace; /* Tech vibe */
    letter-spacing: 1px;
    color: white !important;
}

/* BUTTONS GLOW */
.glow-btn-secondary {
    box-shadow: 0 5px 20px rgba(224, 64, 251, 0.3);
    border: 1px solid rgba(255,255,255,0.1);
}

.glow-btn-success {
    box-shadow: 0 5px 20px rgba(0, 230, 118, 0.3);
    border: 1px solid rgba(255,255,255,0.1);
}


.hover-bright {
    transition: color 0.3s;
}
.hover-bright:hover {
    color: white !important;
}

.glass-icon {
    text-shadow: 0 0 15px currentColor;
}

/* --- FORCED NO-ANIMATION OVERRIDES --- */

/* 1. Stop Card scaling/movement */
.plan-card:hover {
    transform: none !important;
    box-shadow: none !important; /* Or keep default shadow but no CHANGE */
}

/* 2. Stop Button overlay (darkening/lightening) */
.plan-btn:hover .v-btn__overlay,
.v-btn:hover > .v-btn__overlay {
    opacity: 0 !important;
}

/* 3. Stop Button color change */
.plan-btn:hover {
    background-color: transparent !important; /* If outlined, transparent. If flat, original color. */
    /* This is tricky because flat needs color. */
}

/* Better approach for buttons: */
.plan-btn.v-btn--variant-outlined:hover {
    background-color: transparent !important;
    color: inherit !important;
}

.plan-btn.v-btn--variant-flat:hover {
    /* For flat buttons (recommended), we want to keep the original background color */
    /* Vuetify handles this via class, but hover adds overlay. 
       Disabling overlay (above) handles the visual change mostly. 
       But we ensure no transform/shadow change. */
    box-shadow: none !important;
    transform: none !important;
}
</style>