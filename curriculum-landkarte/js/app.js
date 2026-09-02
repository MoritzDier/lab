(() => {
  const phaseGrid = document.querySelector("#phaseGrid");
  const panel = document.querySelector("#detailPanel");
  const panelContent = document.querySelector("#panelContent");
  const scrim = document.querySelector("#scrim");
  const modal = document.querySelector("#modelModal");
  const modalTitle = document.querySelector("#modelModalTitle");
  const modalLink = document.querySelector("#modelModalLink");
  const modalContent = document.querySelector("#modelModalContent");
  const canvas = document.querySelector(".canvas");
  const focusToolbar = document.querySelector("#focusToolbar");
  const focusLabel = document.querySelector("#focusLabel");
  const openFocusedDetails = document.querySelector("#openFocusedDetails");
  const resetFocusButton = document.querySelector("#resetFocus");
  let panelTrigger = null;
  let modalTrigger = null;
  let focusedElement = null;
  let focusedAction = null;
  const setInert = (element,value) => element.toggleAttribute("inert",value);

  const allModules = CURRICULUM.phases.flatMap((phase) => phase.modules);
  const moduleById = (id) => allModules.find((module) => module.id === id);

  const moduleMarkup = (module) => {
    const enabled = Boolean(CURRICULUM.modules[module.id] || CURRICULUM.competenceProfiles[module.id] || CURRICULUM.bachelorDetails?.[module.id] || CURRICULUM.masterDetails?.[module.id]);
    const classes = ["module-chip",module.meta&&"has-meta",module.transversal&&"transversal"].filter(Boolean).join(" ");
    const content=`<span>${module.short}</span>${module.lp?`<b>${module.lp} LP</b>`:module.meta?`<b>${module.meta}</b>`:"<b>ohne LP</b>"}`;
    return enabled?`<button class="${classes}" data-module="${module.id}" type="button">${content}</button>`:`<span class="${classes} is-disabled" aria-label="${module.short}: Detailbeschreibung folgt">${content}<i>Details folgen</i></span>`;
  };
  const groupedModulesMarkup = (modules) => {
    let markup = "";
    for(let index=0;index<modules.length;){
      const module=modules[index];
      if(!module.cluster){markup+=moduleMarkup(module);index+=1;continue;}
      const cluster=[];
      while(index<modules.length&&modules[index].cluster===module.cluster){cluster.push(modules[index]);index+=1;}
      markup+=`<div class="module-cluster cluster-${module.cluster}"><span class="cluster-label"><b>${module.clusterLabel}</b>${module.clusterContext?`<small>${module.clusterContext}</small>`:""}</span>${cluster.map(moduleMarkup).join("")}</div>`;
    }
    return markup;
  };
  const semesterMarkup = (phase) => [...new Set(phase.modules.map((m)=>m.semester))].map((semester)=>`<section class="semester-group"><h4>${semester}. Semester</h4><div>${groupedModulesMarkup(phase.modules.filter((m)=>m.semester===semester))}</div></section>`).join("");
  const compactPhaseMarkup = (phase) => `<div class="phase-compact-list">${phase.compactItems.map((item)=>`<button class="phase-compact-item" data-phase-focus="${phase.id}" data-open-phase-overview type="button" aria-label="${item.title}: Phasenübersicht öffnen"><small>${item.eyebrow}</small><strong>${item.title}</strong><span>${item.text}</span></button>`).join("")}</div>`;

  phaseGrid.innerHTML = CURRICULUM.phases.map((phase)=>`<article class="phase phase-${phase.id}" data-phase-focus="${phase.id}"><button class="phase-head" type="button" data-phase-focus="${phase.id}"${phase.compactItems?` data-open-phase-overview aria-label="${phase.title}: Phasenübersicht öffnen"`:""}><span class="phase-index">${phase.index}</span><span><strong>${phase.title}</strong><em>${phase.subtitle}</em></span></button><div class="module-list">${phase.modules.length?semesterMarkup(phase):phase.compactItems?compactPhaseMarkup(phase):`<p class="phase-placeholder">${phase.placeholder}</p>`}</div></article>`).join("");

  function clearHighlights(){document.querySelectorAll(".is-related,.highlight-zone").forEach((el)=>el.classList.remove("is-related","highlight-zone"));}
  function elementLabel(element){return element.getAttribute("aria-label")||element.querySelector("h2,strong,span")?.textContent.trim()||"Ausgewählter Bereich";}
  function resetFocus({restore=true}={}){
    const previous=focusedElement;
    focusedElement=null;focusedAction=null;
    canvas.style.removeProperty("--focus-x");canvas.style.removeProperty("--focus-y");canvas.style.removeProperty("--focus-scale");
    document.body.classList.remove("focus-mode");
    document.querySelectorAll(".is-focused").forEach((element)=>element.classList.remove("is-focused"));
    focusToolbar.setAttribute("aria-hidden","true");
    setInert(focusToolbar,true);
    if(restore)previous?.focus({preventScroll:true});
  }
  function focusElement(element,action){
    if(!element)return;
    if(focusedElement===element){focusedAction=action;return;}
    const movingBetweenMainZones=(focusedElement?.matches(".system-zone")&&element.matches(".system-zone"))||(focusedElement?.matches(".phase")&&element.matches(".phase"));
    const currentScale=parseFloat(canvas.style.getPropertyValue("--focus-scale"))||1;
    const rect=element.getBoundingClientRect();
    const canvasRect=canvas.getBoundingClientRect();
    const availableWidth=window.innerWidth-48;
    const availableHeight=window.innerHeight-118;
    const isSmallTarget=element.matches(".module-chip");
    const maxScale=isSmallTarget?3.2:element.matches(".phase-head")?2.2:1.75;
    const unscaledWidth=movingBetweenMainZones?rect.width/currentScale:rect.width;
    const unscaledHeight=movingBetweenMainZones?rect.height/currentScale:rect.height;
    const scale=movingBetweenMainZones?currentScale:Math.max(1,Math.min(maxScale,availableWidth/unscaledWidth,availableHeight/unscaledHeight));
    const targetCenterX=movingBetweenMainZones?(rect.left+rect.width/2-canvasRect.left)/currentScale:rect.left+rect.width/2;
    const targetCenterY=movingBetweenMainZones?(rect.top+rect.height/2-canvasRect.top)/currentScale:rect.top+rect.height/2;
    const baseCanvasLeft=movingBetweenMainZones?canvas.offsetLeft-window.scrollX:canvasRect.left;
    const baseCanvasTop=movingBetweenMainZones?canvas.offsetTop-window.scrollY:canvasRect.top;
    const desiredCenterX=window.innerWidth/2;
    const desiredCenterY=(window.innerHeight-62)/2+62;
    const finalTargetWidth=unscaledWidth*scale;
    const finalTargetHeight=unscaledHeight*scale;
    const finalTargetRight=desiredCenterX+finalTargetWidth/2;
    const finalTargetTop=desiredCenterY-finalTargetHeight/2;
    const toolbarRightInset=Math.min(92,Math.max(28,finalTargetWidth*.18));
    focusedElement?.classList.remove("is-focused");
    focusedElement=element;focusedAction=action;
    canvas.style.setProperty("--focus-scale",scale.toFixed(3));
    canvas.style.setProperty("--focus-x",`${(desiredCenterX-baseCanvasLeft-(movingBetweenMainZones?targetCenterX:targetCenterX-baseCanvasLeft)*scale).toFixed(1)}px`);
    canvas.style.setProperty("--focus-y",`${(desiredCenterY-baseCanvasTop-(movingBetweenMainZones?targetCenterY:targetCenterY-baseCanvasTop)*scale).toFixed(1)}px`);
    focusToolbar.style.setProperty("--toolbar-right",`${Math.max(14,window.innerWidth-finalTargetRight+toolbarRightInset).toFixed(1)}px`);
    focusToolbar.style.setProperty("--toolbar-top",`${Math.max(14,finalTargetTop+12).toFixed(1)}px`);
    document.body.classList.add("focus-mode");
    element.classList.add("is-focused");
    focusLabel.textContent=elementLabel(element);
    openFocusedDetails.hidden=!action;
    focusToolbar.setAttribute("aria-hidden","false");
    setInert(focusToolbar,false);
  }
  function setBackgroundInert(value){setInert(canvas,value);setInert(focusToolbar,value||focusToolbar.getAttribute("aria-hidden")==="true");}
  function openPanel(markup,trigger){panelTrigger=trigger;panelContent.innerHTML=markup;setInert(panel,false);panel.classList.add("open");panel.setAttribute("aria-hidden","false");setBackgroundInert(true);scrim.classList.add("visible");document.querySelector("#closePanel").focus();}
  function closePanel({restoreFocus=true}={}){if(!panel.classList.contains("open"))return;panel.classList.remove("open");panel.setAttribute("aria-hidden","true");setInert(panel,true);if(!modal.classList.contains("open")){scrim.classList.remove("visible");setBackgroundInert(false);}clearHighlights();if(restoreFocus)panelTrigger?.focus();}
  function showModule(module,trigger){
    const profile=CURRICULUM.competenceProfiles[module.id];
    const overview=moduleById(module.id);
    const details=CURRICULUM.modules[module.id];
    const bachelorEntry=CURRICULUM.bachelorDetails?.[module.id];
    const structuredDetails=(bachelorEntry?.ref?CURRICULUM.bachelorDetails[bachelorEntry.ref]:bachelorEntry)||CURRICULUM.masterDetails?.[module.id];
    if(structuredDetails){
      const phase=CURRICULUM.masterDetails?.[module.id]?"Master":"Bachelor";
      openPanel(`<span class="panel-kicker">${phase} · ${overview.semester}. Semester</span><h2 id="detailTitle">${overview.short}</h2><div class="panel-meta">${[overview.lp&&overview.lp+" LP",overview.meta].filter(Boolean).join(" · ")}</div><section><h3>Beitrag zur professionellen Kompetenzentwicklung</h3><p class="lead">${structuredDetails.contribution}</p></section><section><h3>Inhalt</h3><ul>${structuredDetails.contents.map((item)=>`<li>${item}</li>`).join("")}</ul></section><section><h3>Qualifikationsziel</h3>${structuredDetails.qualification.map((paragraph)=>`<p>${paragraph}</p>`).join("")}</section>`,trigger);
      return;
    }
    const competenceGoals=profile?`<section><h3>Kompetenzziele</h3><p>Die Studierenden können …</p><ul>${profile.goals.map((goal)=>`<li>${goal}</li>`).join("")}</ul></section>`:"";
    const contents=details?.contents?`<section><h3>Inhalte</h3><ul>${details.contents.map((x)=>`<li>${x}</li>`).join("")}</ul></section>`:"";
    const objective=details?.objective?`<section><h3>Qualifikationsziel</h3><p>${details.objective}</p></section>`:"";
    const development=details?.development?`<section class="development-path"><h3>Entwicklungsbewegung</h3><p>${details.development}</p></section>`:"";
    const links=details?.links?`<section><h3>Verknüpfungen</h3><div class="link-tags">${details.links.map((x)=>`<span>${x}</span>`).join("")}</div></section>`:"";
    openPanel(`<span class="panel-kicker">${overview?overview.semester+". Semester":details.semester}</span><h2 id="detailTitle">${overview?.short||details.title}</h2><div class="panel-meta">${details?.lp||[overview?.lp&&overview.lp+" LP",overview?.meta].filter(Boolean).join(" · ")}</div><section><h3>Beitrag zur Kompetenzentwicklung</h3><p class="lead">${profile?.contribution||details.contribution}</p></section>${competenceGoals}${contents}${objective}${development}${links}`,trigger);
  }
  function showConcept(concept,trigger){
    const sections=(concept.sections||[]).map((section)=>`<section><h3>${section.title}</h3>${section.text?`<p>${section.text}</p>`:""}${section.items?`<ul>${section.items.map((item)=>`<li>${item}</li>`).join("")}</ul>`:""}${section.steps?`<ol class="concept-steps">${section.steps.map((step)=>`<li>${step}</li>`).join("")}</ol>`:""}${section.note?`<p class="section-note">${section.note}</p>`:""}${section.figure?`<figure class="concept-figure"><div class="pdf-preview-shell"${section.figure.aspect?` style="aspect-ratio:${section.figure.aspect}"`:""}><object data="${section.figure.src}#toolbar=0&amp;navpanes=0&amp;scrollbar=0&amp;view=FitH" type="application/pdf" aria-label="${section.figure.title}"><a href="${section.figure.src}" target="_blank" rel="noopener">Abbildung als PDF öffnen</a></object></div><figcaption>${section.figure.caption}</figcaption><button type="button" data-figure-pdf="${section.figure.src}" data-figure-title="${section.figure.title}">Abbildung vergrößern ↗</button></figure>`:""}${section.refs?`<p class="section-references">${section.refs}</p>`:""}</section>`).join("");
    const links=concept.links?`<section><h3>Curriculare Anknüpfungspunkte</h3><div class="link-tags">${concept.links.map((link)=>`<span>${link}</span>`).join("")}</div></section>`:"";
    const articleLinks=concept.articleLinks?`<section class="article-links"><h3>Quellen und Vertiefung</h3>${concept.articleLinks.map((link)=>`<a href="${link.href}" target="_blank" rel="noopener">${link.label} ↗</a>`).join("")}</section>`:"";
    const sources=concept.sourceGroups?`<section class="concept-sources"><h3>Literaturhinweise</h3>${concept.sourceGroups.map((group)=>`<div class="source-group"><b>${group.title}</b><p>${group.entries.join(" · ")}</p></div>`).join("")}</section>`:concept.sources?`<section class="concept-sources"><h3>Grundlagen</h3><p>${concept.sources.join(" · ")}</p></section>`:"";
    const sequence=concept.sequence?`<section class="development-path"><h3>Entwicklungsbewegung</h3><p>${concept.sequence}</p></section>`:"";
    openPanel(`<span class="panel-kicker">${concept.kicker}</span><h2 id="detailTitle">${concept.title}</h2><section><p class="lead">${concept.text}</p></section>${sections}${sequence}${links}${articleLinks}${sources}`,trigger);
  }
  function openVisualModal({title,href,content},trigger){modalTrigger=trigger;modalTitle.textContent=title;modalLink.href=href;modalContent.innerHTML=content;setInert(modal,false);modal.classList.add("open");modal.setAttribute("aria-hidden","false");setInert(panel,true);setBackgroundInert(true);scrim.classList.add("visible");document.querySelector("#closeModal").focus();}
  function highlightModule(id){document.querySelector(`[data-module="${id}"]`)?.classList.add("is-related");const entry=moduleById(id);(entry?.links||[]).forEach((linked)=>document.querySelector(`[data-module="${linked}"]`)?.classList.add("is-related"));if(entry?.areas?.includes("subjective"))document.querySelector(".theory-zone")?.classList.add("highlight-zone");if(entry?.areas?.includes("practice"))document.querySelector(".entanglement-zone")?.classList.add("highlight-zone");}

  function actionFor(element){
    if(element.matches("[data-module]")){
      const id=element.dataset.module;
      const enabled=CURRICULUM.modules[id]||CURRICULUM.competenceProfiles[id]||CURRICULUM.bachelorDetails?.[id]||CURRICULUM.masterDetails?.[id];
      return enabled?()=>{clearHighlights();highlightModule(id);showModule({id},element);}:null;
    }
    if(element.matches("[data-focus]"))return ()=>showConcept(CURRICULUM.concepts[element.dataset.focus],element);
    if(element.matches("[data-phase-focus]")){const phase=CURRICULUM.phases.find((item)=>item.id===element.dataset.phaseFocus);const detail=phase.detail||{kicker:phase.index,title:phase.title,text:phase.placeholder||`${phase.subtitle}. Die Semester strukturieren einen rekursiven Entwicklungsraum.`,sequence:"Komplexität · Eigenständigkeit · Situationsbezogenheit · Reflexivität · Verantwortung nehmen zu."};return ()=>showConcept(detail,element);}
    return null;
  }
  function visualTargetFor(element){
    if(element.dataset.focus==="cycle")return document.querySelector(".entanglement-zone");
    if(element.matches("[data-module]"))return element.closest(".phase")||element;
    if(element.matches("[data-phase-focus]"))return element.closest(".phase");
    if(element.closest(".micro-nav"))return document.querySelector(`.canvas [data-focus="${element.dataset.focus}"]:not(.micro-nav *)`);
    return element;
  }
  document.addEventListener("click",(event)=>{
    const figureButton=event.target.closest("[data-figure-pdf]");
    const detailHotspot=event.target.closest("[data-detail-hotspot]");
    const phaseOverviewTrigger=event.target.closest("[data-open-phase-overview]");
    const focusTarget=event.target.closest("[data-module],[data-focus],[data-phase-focus]");
    if(figureButton){const src=figureButton.dataset.figurePdf;openVisualModal({title:figureButton.dataset.figureTitle,href:src,content:`<object data="${src}#toolbar=1&amp;navpanes=0&amp;view=Fit" type="application/pdf" aria-label="${figureButton.dataset.figureTitle}"><a href="${src}" target="_blank" rel="noopener">Abbildung als PDF öffnen</a></object>`},figureButton);return;}
    if(phaseOverviewTrigger){event.preventDefault();actionFor(phaseOverviewTrigger)?.();return;}
    if(detailHotspot){
      event.preventDefault();event.stopPropagation();
      const trigger=detailHotspot.closest("[data-focus]");
      const action=actionFor(trigger);
      const visualTarget=visualTargetFor(trigger);
      if(focusedElement===visualTarget){action?.();return;}
    }
    if(focusTarget){
      event.preventDefault();
      const action=actionFor(focusTarget);
      const visualTarget=visualTargetFor(focusTarget);
      if(!visualTarget){action?.();return;}
      const moduleInsideFocusedPhase=focusTarget.matches("[data-module]")&&focusedElement===visualTarget;
      if(moduleInsideFocusedPhase){action?.();return;}
      if(focusedElement===visualTarget){resetFocus();return;}
      const phaseAction=visualTarget.matches(".phase")?actionFor(visualTarget):action;
      focusElement(visualTarget,phaseAction);
      return;
    }
    if(focusedElement&&!event.target.closest("#focusToolbar,#scrim,.detail-panel,.modal"))resetFocus();
  });
  openFocusedDetails.addEventListener("click",()=>focusedAction?.());
  resetFocusButton.addEventListener("click",()=>resetFocus());
  document.querySelector('.micro-nav a[href="#top"]').addEventListener("click",()=>resetFocus({restore:false}));
  window.addEventListener("resize",()=>{if(focusedElement)resetFocus({restore:false});});
  function closeModal({restoreFocus=true}={}){if(!modal.classList.contains("open"))return;modal.classList.remove("open");modal.setAttribute("aria-hidden","true");setInert(modal,true);if(panel.classList.contains("open")){setInert(panel,false);}else{scrim.classList.remove("visible");setBackgroundInert(false);}if(restoreFocus)modalTrigger?.focus();}
  function trapFocus(event){if(event.key!=="Tab")return;const container=modal.classList.contains("open")?modal:panel.classList.contains("open")?panel:null;if(!container)return;const focusable=[...container.querySelectorAll('a[href],button:not([disabled]),object,[tabindex]:not([tabindex="-1"])')].filter((element)=>!element.closest("[inert]")&&element.getClientRects().length);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  document.querySelector("#closePanel").addEventListener("click",()=>closePanel());document.querySelector("#closeModal").addEventListener("click",()=>closeModal());scrim.addEventListener("click",()=>{closeModal({restoreFocus:false});closePanel();});document.addEventListener("keydown",(event)=>{trapFocus(event);if(event.key==="Escape"){if(modal.classList.contains("open"))closeModal();else if(panel.classList.contains("open"))closePanel();else if(focusedElement)resetFocus({restore:false});}});
})();
