// initialization

const RESPONSIVE_WIDTH = 1280

let headerWhiteBg = false
let isHeaderCollapsed = window.innerWidth < RESPONSIVE_WIDTH
const collapseBtn = document.getElementById("collapse-btn")
const collapseHeaderItems = document.getElementById("collapsed-header-items")



function onHeaderClickOutside(e) {

    if (!collapseHeaderItems.contains(e.target)) {
        toggleHeader()
    }

}


function toggleHeader() {
    if (isHeaderCollapsed) {
        // collapseHeaderItems.classList.remove("max-md:tw-opacity-0")
        collapseHeaderItems.classList.add("opacity-100",)
        collapseHeaderItems.style.width = "60vw"
        collapseBtn.classList.remove("bi-list")
        collapseBtn.classList.add("bi-x", "max-lg:tw-fixed")
        isHeaderCollapsed = false

        setTimeout(() => window.addEventListener("click", onHeaderClickOutside), 1)

    } else {
        collapseHeaderItems.classList.remove("opacity-100")
        collapseHeaderItems.style.width = "0vw"
        collapseBtn.classList.remove("bi-x", "max-lg:tw-fixed")
        collapseBtn.classList.add("bi-list")
        isHeaderCollapsed = true
        window.removeEventListener("click", onHeaderClickOutside)

    }
}

function responsive() {
    if (window.innerWidth >= RESPONSIVE_WIDTH) {
        collapseHeaderItems.style.width = ""

    } else {
        isHeaderCollapsed = true
    }
}

window.addEventListener("resize", responsive)


/**
 * Temporary business-card intro
 */

const cardIntro = document.querySelector(".card-intro")
const introSessionKey = "dierlab-intro-dismissed"
let heroRevealStarted = false

if (!cardIntro) {
    window.sessionStorage.setItem(introSessionKey, "true")
}

if (cardIntro) {
    if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual"
    }

    const siteDirectory = new URL("./", window.location.href)
    const navigationEntry = window.performance.getEntriesByType("navigation")[0]
    let cameFromInsideSite = false
    let cameFromOutsideSite = false

    if (document.referrer) {
        try {
            const referrerUrl = new URL(document.referrer)
            cameFromInsideSite = referrerUrl.origin === siteDirectory.origin
                && referrerUrl.pathname.startsWith(siteDirectory.pathname)
            cameFromOutsideSite = !cameFromInsideSite
        } catch {
            cameFromInsideSite = false
        }
    }

    const introAlreadyDismissed = window.sessionStorage.getItem(introSessionKey) === "true"
    const skipIntro = cameFromInsideSite
        || navigationEntry?.type === "reload"
        || (introAlreadyDismissed && !cameFromOutsideSite)
    const continueLink = cardIntro.querySelector(".card-intro__continue")
    const introBackdrop = cardIntro.querySelector(".card-intro__backdrop")
    let introDismissed = false
    let touchStartY = null
    let upwardScrollIntent = 0
    let lastUpwardScrollAt = 0
    let introFinishTimer = null
    let returningClassTimer = null

    const resetStartScroll = () => {
        window.requestAnimationFrame(() => window.scrollTo(0, 0))
    }

    const finishIntro = () => {
        window.clearTimeout(introFinishTimer)
        cardIntro.classList.add("is-leaving")
        cardIntro.classList.remove("is-returning")
        cardIntro.hidden = true
        document.body.classList.remove("intro-active")
        window.sessionStorage.setItem(introSessionKey, "true")
        resetStartScroll()
    }

    const showIntro = (event) => {
        if (!introDismissed || window.scrollY > 1) return
        if (event?.cancelable) event.preventDefault()

        window.clearTimeout(introFinishTimer)
        window.clearTimeout(returningClassTimer)
        introDismissed = false
        upwardScrollIntent = 0
        cardIntro.hidden = false
        document.body.classList.add("intro-active")
        resetStartScroll()

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                cardIntro.classList.add("is-returning")
                cardIntro.classList.remove("is-leaving")
                returningClassTimer = window.setTimeout(() => {
                    cardIntro.classList.remove("is-returning")
                }, 2200)
            })
        })
    }

    const dismissIntro = (event) => {
        if (introDismissed) return
        if (event?.cancelable) event.preventDefault()

        introDismissed = true
        window.clearTimeout(returningClassTimer)
        cardIntro.classList.remove("is-returning")
        cardIntro.classList.add("is-leaving")
        window.setTimeout(playHeroReveal, 720)
        const onIntroTransitionEnd = (transitionEvent) => {
            if (transitionEvent.target === introBackdrop && transitionEvent.propertyName === "opacity") {
                introBackdrop.removeEventListener("transitionend", onIntroTransitionEnd)
                finishIntro()
            }
        }
        introBackdrop.addEventListener("transitionend", onIntroTransitionEnd)
        introFinishTimer = window.setTimeout(finishIntro, 3000)
    }

    const onWheel = (event) => {
        if (!introDismissed) {
            if (event.deltaY > 0) dismissIntro(event)
            return
        }

        const now = window.performance.now()
        if (window.scrollY <= 1 && event.deltaY < 0) {
            if (now - lastUpwardScrollAt > 700) upwardScrollIntent = 0
            upwardScrollIntent += Math.abs(event.deltaY)
            lastUpwardScrollAt = now

            if (upwardScrollIntent >= 140) showIntro(event)
        } else {
            upwardScrollIntent = 0
        }
    }

    const onKeydown = (event) => {
        if (["ArrowDown", "PageDown", " "].includes(event.key)) dismissIntro(event)
    }

    const onTouchStart = (event) => {
        touchStartY = event.touches[0]?.clientY ?? null
    }

    const onTouchMove = (event) => {
        const currentY = event.touches[0]?.clientY
        if (touchStartY !== null && currentY !== undefined && touchStartY - currentY > 24) {
            dismissIntro(event)
        }
    }

    if (skipIntro) {
        introDismissed = true
        finishIntro()
        window.addEventListener("load", resetStartScroll, { once: true })
        window.addEventListener("pageshow", resetStartScroll, { once: true })
    }

    window.addEventListener("keydown", onKeydown)
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("wheel", onWheel, { passive: false })
    continueLink?.addEventListener("click", dismissIntro)
}


/**
 * Animations
 */

gsap.registerPlugin(ScrollTrigger)

gsap.set(".reveal-hero-text", {
    opacity: 0,
    y: "100%",
})

gsap.set(".reveal-hero-img", {
    opacity: 0,
    y: "100%",
})


gsap.set(".reveal-up", {
    opacity: 0,
    y: "100%",
})

function playHeroReveal() {
    if (heroRevealStarted) return
    heroRevealStarted = true

    gsap.to(".reveal-hero-text", {
        opacity: 1,
        y: "0%",
        duration: 0.8,
        stagger: 0.5,
    })

    gsap.to(".reveal-hero-img", {
        opacity: 1,
        y: "0%",
    })
}

window.addEventListener("load", () => {
    if (!cardIntro || cardIntro.hidden) playHeroReveal()
})


// ------------- reveal section animations ---------------

const sections = gsap.utils.toArray("section")

sections.forEach((sec) => {

    const revealUptimeline = gsap.timeline({paused: true, 
                                            scrollTrigger: {
                                                            trigger: sec,
                                                            start: "10% 80%", // top of trigger hits the top of viewport
                                                            end: "20% 90%",
                                                            // markers: true,
                                                            // scrub: 1,
                                                        }})

    revealUptimeline.to(sec.querySelectorAll(".reveal-up"), {
        opacity: 1,
        duration: 0.8,
        y: "0%",
        stagger: 0.2,
    })


})
