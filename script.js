/* =========================
   CONFIG
========================= */

const BACKEND_URL = "http://localhost:3000";

const SERVER_IP = "mc.twojserwer.pl";

const DISCORD_INVITE =
    "https://discord.gg/TWOJ-LINK";


/* =========================
   STATE
========================= */

let selectedAmount = 0;
let selectedProduct = "VPLN";
let selectedProductType = "VPLN";
let selectedProductId = "VPLN_CUSTOM";

let currentOrder = null;

let toastTimeout = null;


/* =========================
   TOAST
========================= */

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


/* =========================
   MINECRAFT CHARACTER
========================= */

function createMinecraftCharacter() {
    const container = document.getElementById("heroCharacter");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="mc-character">

            <div class="mc-glow"></div>

            <div class="mc-shadow"></div>

            <div class="mc-head">
                <div class="mc-hair"></div>

                <div class="mc-eye mc-eye-left"></div>
                <div class="mc-eye mc-eye-right"></div>

                <div class="mc-mouth"></div>
            </div>

            <div class="mc-body">

                <div class="mc-shirt-detail"></div>

                <div class="mc-arm mc-arm-left">
                    <div class="mc-hand"></div>
                </div>

                <div class="mc-arm mc-arm-right">
                    <div class="mc-hand"></div>
                </div>

            </div>

            <div class="mc-legs">

                <div class="mc-leg mc-leg-left">
                    <div class="mc-shoe"></div>
                </div>

                <div class="mc-leg mc-leg-right">
                    <div class="mc-shoe"></div>
                </div>

            </div>

            <div class="mc-emerald">
                <div class="mc-emerald-shine"></div>
            </div>

        </div>
    `;
}


/* =========================
   MODAL
========================= */

function openPurchaseModal({
    product,
    productType,
    productId,
    amount
}) {
    selectedProduct = product;
    selectedProductType = productType;
    selectedProductId = productId;
    selectedAmount = Number(amount);

    const title = document.getElementById("productTitle");
    const price = document.getElementById("orderPrice");
    const description = document.getElementById("productDescription");
    const message = document.getElementById("modalMessage");
    const modal = document.getElementById("purchaseModal");
    const nick = document.getElementById("minecraftNick");

    if (title) {
        title.textContent = product;
    }

    if (price) {
        price.textContent = selectedAmount;
    }

    if (description) {
        if (productType === "RANK") {
            description.textContent =
                `Ranga ${product} na serwerze Minecraft.`;
        } else {
            description.textContent =
                `${selectedAmount} VPLN do wykorzystania na serwerze.`;
        }
    }

    if (message) {
        message.textContent = "";
    }

    if (nick) {
        nick.value = "";
    }

    if (!modal) {
        return;
    }

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    setTimeout(() => {
        if (nick) {
            nick.focus();
        }
    }, 150);
}


function closePurchaseModal() {
    const modal = document.getElementById("purchaseModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}


/* =========================
   VPLN
========================= */

function buyVpln(amount) {
    const value = Number(amount);

    if (!Number.isInteger(value) || value < 1) {
        return;
    }

    openPurchaseModal({
        product: `${value} VPLN`,
        productType: "VPLN",
        productId: `VPLN_${value}`,
        amount: value
    });
}


function buyCustom() {
    const input = document.getElementById("customAmount");

    if (!input) {
        return;
    }

    const amount = Number(input.value);

    if (
        !Number.isInteger(amount) ||
        amount < 1 ||
        amount > 100000
    ) {
        showToast("Podaj prawidłową ilość VPLN.");
        input.focus();
        return;
    }

    openPurchaseModal({
        product: `${amount} VPLN`,
        productType: "VPLN",
        productId: "VPLN_CUSTOM",
        amount
    });
}


/* =========================
   RANKS
========================= */

function buyRank(rankName, price) {
    const numericPrice = Number(price);

    if (
        !rankName ||
        !Number.isFinite(numericPrice) ||
        numericPrice < 1
    ) {
        return;
    }

    openPurchaseModal({
        product: rankName,
        productType: "RANK",
        productId: rankName,
        amount: numericPrice
    });
}


/* =========================
   PAYMENT
========================= */

async function selectPayment(paymentMethod) {
    await createOrderAndPay(paymentMethod);
}


async function createOrderAndPay(paymentMethod) {
    const nickInput =
        document.getElementById("minecraftNick");

    const message =
        document.getElementById("modalMessage");

    if (!nickInput || !message) {
        return;
    }

    const nick = nickInput.value.trim();

    if (!/^[A-Za-z0-9_]{3,16}$/.test(nick)) {
        message.textContent =
            "Podaj prawidłowy nick Minecraft.";

        nickInput.focus();
        return;
    }

    if (
        !Number.isFinite(selectedAmount) ||
        selectedAmount < 1
    ) {
        message.textContent =
            "Nieprawidłowa cena produktu.";

        return;
    }

    if (!paymentMethod) {
        message.textContent =
            "Wybierz metodę płatności.";

        return;
    }

    message.textContent =
        "Tworzenie zamówienia...";

    const paymentButtons =
        document.querySelectorAll(".payment-methods button");

    paymentButtons.forEach((button) => {
        button.disabled = true;
        button.style.opacity = "0.55";
        button.style.pointerEvents = "none";
    });

    try {

        const orderResponse = await fetch(
            `${BACKEND_URL}/api/orders`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    nick,

                    productType:
                        selectedProductType,

                    productId:
                        selectedProductId,

                    productName:
                        selectedProduct,

                    amount:
                        selectedProductType === "RANK"
                            ? 1
                            : selectedAmount,

                    price:
                        selectedAmount,

                    paymentMethod
                })
            }
        );

        let orderData;

        try {
            orderData =
                await orderResponse.json();
        } catch {
            throw new Error(
                "Serwer zwrócił nieprawidłową odpowiedź."
            );
        }

        if (!orderResponse.ok) {
            throw new Error(
                orderData.error ||
                "Nie udało się utworzyć zamówienia."
            );
        }

        if (!orderData.order) {
            throw new Error(
                "Brak danych zamówienia."
            );
        }

        currentOrder = orderData.order;

        message.textContent =
            "Przygotowywanie płatności...";


        const paymentResponse = await fetch(
            `${BACKEND_URL}/api/payments/przelewy24`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    orderNumber:
                        currentOrder.orderNumber,

                    paymentMethod
                })
            }
        );

        let paymentData;

        try {
            paymentData =
                await paymentResponse.json();
        } catch {
            throw new Error(
                "Serwer płatności zwrócił nieprawidłową odpowiedź."
            );
        }

        if (!paymentResponse.ok) {
            throw new Error(
                paymentData.error ||
                "Nie udało się utworzyć płatności."
            );
        }

        if (!paymentData.paymentUrl) {
            throw new Error(
                "Brak adresu płatności."
            );
        }

        window.location.href =
            paymentData.paymentUrl;

    } catch (error) {

        console.error(
            "Błąd płatności:",
            error
        );

        message.textContent =
            error.message ||
            "Wystąpił nieoczekiwany błąd.";

    } finally {

        paymentButtons.forEach((button) => {
            button.disabled = false;
            button.style.opacity = "";
            button.style.pointerEvents = "";
        });
    }
}


/* =========================
   COPY SERVER IP
========================= */

async function copyServerIP() {

    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                SERVER_IP
            );

        } else {

            const textarea =
                document.createElement("textarea");

            textarea.value = SERVER_IP;

            textarea.style.position = "fixed";
            textarea.style.left = "-9999px";

            document.body.appendChild(textarea);

            textarea.select();

            document.execCommand("copy");

            textarea.remove();
        }

        showToast(
            `Skopiowano IP: ${SERVER_IP}`
        );

    } catch (error) {

        console.error(
            "Nie udało się skopiować IP:",
            error
        );

        showToast(
            `IP serwera: ${SERVER_IP}`
        );
    }
}


/* =========================
   DISCORD
========================= */

function setupDiscord() {

    const button =
        document.getElementById(
            "discordJoinButton"
        );

    if (!button) {
        return;
    }

    button.href = DISCORD_INVITE;
}


/* =========================
   MODAL CLICK
========================= */

document.addEventListener(
    "click",
    (event) => {

        const modal =
            document.getElementById(
                "purchaseModal"
            );

        const backdrop =
            document.querySelector(
                ".modal-backdrop"
            );

        if (
            modal &&
            backdrop &&
            event.target === backdrop
        ) {
            closePurchaseModal();
        }
    }
);


/* =========================
   ESC
========================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {
            closePurchaseModal();
        }
    }
);


/* =========================
   CUSTOM VPLN ENTER
========================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key !== "Enter" ||
            event.target.id !== "customAmount"
        ) {
            return;
        }

        event.preventDefault();

        buyCustom();
    }
);


/* =========================
   ⚡ LIGHTNING
========================= */

function startLightning() {

    const lightningLayer =
        document.getElementById("lightning-layer");

    if (!lightningLayer) {
        console.error(
            "Nie znaleziono #lightning-layer"
        );
        return;
    }


    function spawnLightning() {

        const svg =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

        svg.classList.add("lightning");

        svg.setAttribute(
            "viewBox",
            "0 0 260 900"
        );


        /*
         * GŁÓWNY PIORUN
         */

        const mainPath =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );

        const points = [
            [130, 0],

            [
                105 + Math.random() * 35,
                100
            ],

            [
                145 + Math.random() * 30,
                190
            ],

            [
                90 + Math.random() * 50,
                300
            ],

            [
                135 + Math.random() * 40,
                400
            ],

            [
                80 + Math.random() * 50,
                520
            ],

            [
                125 + Math.random() * 40,
                650
            ],

            [
                90 + Math.random() * 50,
                780
            ],

            [120, 900]
        ];


        let path =
            `M ${points[0][0]} ${points[0][1]}`;


        for (
            let i = 1;
            i < points.length;
            i++
        ) {

            path +=
                ` L ${points[i][0]} ${points[i][1]}`;
        }


        mainPath.setAttribute(
            "d",
            path
        );

        svg.appendChild(
            mainPath
        );


        /*
         * ODNOŚNIKI PIORUNA
         */

        for (
            let i = 2;
            i < points.length - 1;
            i += 2
        ) {

            const [x, y] =
                points[i];


            const branch =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );


            const direction =
                Math.random() > 0.5
                    ? 1
                    : -1;


            branch.setAttribute(
                "d",
                `
                M ${x} ${y}
                L ${
                    x +
                    direction *
                    (35 + Math.random() * 50)
                } ${y + 55}
                L ${
                    x +
                    direction *
                    (20 + Math.random() * 40)
                } ${y + 105}
                `
            );


            svg.appendChild(
                branch
            );
        }


        /*
         * PO LEWEJ LUB PRAWEJ
         */

        const left =
            Math.random() < 0.5;


        if (left) {

            svg.style.left =
                `${Math.random() * 18 - 2}%`;

        } else {

            svg.style.left =
                `${82 + Math.random() * 18}%`;
        }


        /*
         * LOSOWA SKALA
         */

        const scale =
            0.65 +
            Math.random() * 0.55;


        svg.style.transform =
            `scale(${scale})`;


        lightningLayer.appendChild(
            svg
        );


        /*
         * USUNIĘCIE PO ANIMACJI
         */

        setTimeout(() => {

            svg.remove();

        }, 600);
    }


    /*
     * PIERWSZY PIORUN
     */

    setTimeout(() => {

        spawnLightning();

    }, 1000);


    /*
     * KOLEJNE PIORUNY
     */

    setInterval(() => {

        spawnLightning();

    }, 2000);
}


/* =========================
   START
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createMinecraftCharacter();

        const ip =
            document.getElementById("serverIp");

        const footerIp =
            document.getElementById("footerIp");


        if (ip) {
            ip.textContent =
                SERVER_IP;
        }


        if (footerIp) {
            footerIp.textContent =
                SERVER_IP;
        }


        setupDiscord();


        /*
         * ⚡ START PIORUNÓW
         */

        startLightning();
    }
);