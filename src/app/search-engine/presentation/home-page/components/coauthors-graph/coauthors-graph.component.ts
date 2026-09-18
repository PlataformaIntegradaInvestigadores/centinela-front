import { Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';

import { faDownload, faVectorSquare } from '@fortawesome/free-solid-svg-icons';
import { DOCUMENT } from '@angular/common';
import { Author, AuthorNode } from '../../../../../shared/interfaces/author.interface';
import { Node, Link } from '../../../../../shared/d3';
import { AuthorService } from '../../../../domain/services/author.service';
import * as htmlToImage from 'html-to-image';
import * as d3 from 'd3';
import { GraphComponent } from '../../../../../shared/components/visuals/graph/graph.component';

@Component({
  selector: 'app-coauthors-graph',
  templateUrl: './coauthors-graph.component.html',
  styleUrls: ['./coauthors-graph.component.css'],
})
export class CoauthorsGraphComponent implements OnInit {
  @Input() author!: Author;

  d3Nodes: Node[] = [];
  d3Links: Link[] = [];

  apiNodes: AuthorNode[] = [];

  forces: { manyBody: number; collide: number } = {
    manyBody: 150,
    collide: 15,
  };

  showGraph: boolean = false;
  loading: boolean = false;
  expanding = false;
  expandedNodeIds = new Set<string>();
  showLegend = true;
  notificationMessage: string | null = null;
  notificationType: 'success' | 'warning' | 'error' | 'info' = 'info';
  private notificationTimer: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('downloadEl') downloadEl!: ElementRef;
  @ViewChild('graphRef') graphComponent!: GraphComponent;
  faDownload = faDownload;
  faVectorSquare = faVectorSquare;

  // Seleccion de zona para exportar solo una parte del grafo
  selectingRegion = false;
  regionStart: { x: number; y: number } | null = null;
  regionRect: { x: number; y: number; w: number; h: number } | null = null;
  selectedNode: {
    author: AuthorNode;
    degree: number;
    collaborators: { id: string; name: string; strength: number }[];
  } | null = null;
  showAllCollaborators = false;

  constructor(
    private authorService: AuthorService,
    @Inject(DOCUMENT) private coreDoc: Document,
  ) {
    this.d3Links = [];
    this.d3Nodes = [];
  }

  ngOnInit() {
    this.loading = true;
    this.authorService.getCoauthorsById(this.author.scopus_id).subscribe({
      next: (coauthors) => {
        this.apiNodes = [...(coauthors.data.nodes || [])];
        // Si el autor no tiene coautores reales solo quedaria su propio nodo
        // suelto; en ese caso mostramos un mensaje en vez de un grafo vacio.
        const hasCoauthors = this.apiNodes.length > 0;
        if (
          !this.apiNodes.some((node) => String(node.scopus_id) === String(this.author.scopus_id))
        ) {
          this.apiNodes.push({
            scopus_id: this.author.scopus_id,
            initials: this.author.initials,
            first_name: this.author.first_name,
            last_name: this.author.last_name,
            weight: 0,
          });
        }
        this.setupNodes();
        this.setupLinks(coauthors.data.links);
        const rootId = String(this.author.scopus_id);
        this.expandedNodeIds.add(rootId);
        const rootNode = this.d3Nodes.find((node) => String(node.id) === rootId);
        if (rootNode) rootNode.isExpanded = true;
        this.showGraph = hasCoauthors;
        this.loading = false;
      },
      error: () => {
        this.showGraph = false;
        this.loading = false;
      },
    });
  }

  toggleLegend() {
    this.showLegend = !this.showLegend;
  }

  showNotification(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    this.notificationMessage = message;
    this.notificationType = type;
    if (this.notificationTimer) clearTimeout(this.notificationTimer);
    this.notificationTimer = setTimeout(() => {
      this.notificationMessage = null;
      this.notificationTimer = null;
    }, 3200);
  }

  setupNodes() {
    this.apiNodes.forEach((node) => {
      const nodeId = String(node.scopus_id);
      const nodeLevel = nodeId === String(this.author.scopus_id) ? 0 : 1;
      this.d3Nodes.push(
        new Node(
          nodeId,
          this.apiNodes.length,
          this.truncarCadena(node.first_name) + ' ' + this.truncarCadena(node.last_name),
          {
            enablePopover: false,
            title: 'Author',
            content:
              node.first_name && node.last_name
                ? `${node.first_name} ${node.last_name}`
                : node.last_name || '',
            link: 'profile/' + node.scopus_id,
            expandable: true,
            onExpand: () => this.expandGraph(nodeId),
            onSelect: () => this.selectNode(nodeId),
          },
          undefined,
          undefined,
          nodeLevel,
        ),
      );
    });
  }

  truncarCadena(texto: string): string {
    const indiceEspacio = texto.indexOf(' ');
    const indiceGuion = texto.indexOf('-');
    if (indiceEspacio !== -1 && indiceGuion !== -1) {
      return texto.substring(0, Math.min(indiceEspacio, indiceGuion));
    } else if (indiceEspacio !== -1) {
      return texto.substring(0, indiceEspacio);
    } else if (indiceGuion !== -1) {
      return texto.substring(0, indiceGuion);
    } else {
      return texto;
    }
  }

  setupLinks(
    links: { source: string | number; target: string | number; collabStrength: number }[],
  ) {
    links.forEach((link) => {
      const sourceId = String(link.source);
      const targetId = String(link.target);
      this.d3Nodes[this.getIndexByScopusId(sourceId)].degree++;
      this.d3Nodes[this.getIndexByScopusId(targetId)].degree++;
      this.d3Links.push(new Link(sourceId, targetId, link.collabStrength * 5));
    });
  }

  getIndexByScopusId(scopusId: string | number) {
    return this.d3Nodes.findIndex((node) => String(node.id) === String(scopusId));
  }

  selectNode(id: string | number, preserveShowAll = false) {
    if (this.selectingRegion) return;

    const idStr = String(id);
    const targetNode = this.d3Nodes.find((node) => String(node.id) === idStr);
    const targetApiNode = this.apiNodes.find((node) => String(node.scopus_id) === idStr);
    if (!targetNode || !targetApiNode) return;

    const collaborators: { id: string; name: string; strength: number }[] = [];
    this.d3Links.forEach((link) => {
      const sourceId =
        typeof link.source === 'object' ? String(link.source.id) : String(link.source);
      const targetId =
        typeof link.target === 'object' ? String(link.target.id) : String(link.target);
      if (sourceId !== idStr && targetId !== idStr) return;

      const collaboratorId = sourceId === idStr ? targetId : sourceId;
      const collaborator = this.d3Nodes.find((node) => String(node.id) === collaboratorId);
      if (collaborator) {
        collaborators.push({
          id: collaboratorId,
          name: collaborator.label,
          strength: Number((link.strokeWidth / 5).toFixed(2)),
        });
      }
    });

    collaborators.sort((a, b) => b.strength - a.strength);
    this.d3Nodes.forEach((node) => (node.isSelected = String(node.id) === idStr));
    this.selectedNode = {
      author: targetApiNode,
      degree: targetNode.degree,
      collaborators,
    };
    if (!preserveShowAll) this.showAllCollaborators = false;
    this.graphComponent?.refreshView();
  }

  closePanel() {
    this.selectedNode = null;
    this.d3Nodes.forEach((node) => (node.isSelected = false));
    this.graphComponent?.refreshView();
  }

  toggleShowAllCollaborators() {
    this.showAllCollaborators = !this.showAllCollaborators;
  }

  isNodeExpanded(scopusId: string | number) {
    return this.expandedNodeIds.has(String(scopusId));
  }

  onPanelExpandNetwork() {
    if (this.selectedNode) this.expandGraph(this.selectedNode.author.scopus_id);
  }

  expandGraph(scopusId: string | number) {
    const id = String(scopusId);
    if (this.expandedNodeIds.has(id) || this.expanding) return;

    this.expandedNodeIds.add(id);
    this.expanding = true;
    this.authorService.getCoauthorsById(scopusId).subscribe({
      next: (coauthors) => {
        const newApiNodes = [...(coauthors.data.nodes || [])];
        const newLinks = [...(coauthors.data.links || [])];
        const parentNode = this.d3Nodes.find((node) => String(node.id) === id);
        const newLevel = (parentNode?.level ?? 1) + 1;
        let addedNodes = 0;

        newApiNodes.forEach((apiNode) => {
          const nodeId = String(apiNode.scopus_id);
          if (this.getIndexByScopusId(nodeId) !== -1) return;

          addedNodes++;
          this.apiNodes.push(apiNode);
          this.d3Nodes.push(
            new Node(
              nodeId,
              this.apiNodes.length,
              `${this.truncarCadena(apiNode.first_name)} ${this.truncarCadena(apiNode.last_name)}`,
              {
                enablePopover: false,
                title: 'Author',
                content:
                  apiNode.first_name && apiNode.last_name
                    ? `${apiNode.first_name} ${apiNode.last_name}`
                    : apiNode.last_name || '',
                link: 'profile/' + apiNode.scopus_id,
                expandable: true,
                onExpand: () => this.expandGraph(nodeId),
                onSelect: () => this.selectNode(nodeId),
              },
              undefined,
              undefined,
              newLevel,
            ),
          );
        });

        this.d3Nodes.forEach((node) => (node.totalNodes = this.apiNodes.length));
        newLinks.forEach((link) => {
          const sourceId = String(link.source);
          const targetId = String(link.target);
          const sourceIndex = this.getIndexByScopusId(sourceId);
          const targetIndex = this.getIndexByScopusId(targetId);
          if (sourceIndex === -1 || targetIndex === -1) return;

          const exists = this.d3Links.some((existingLink) => {
            const existingSource =
              typeof existingLink.source === 'object'
                ? String(existingLink.source.id)
                : String(existingLink.source);
            const existingTarget =
              typeof existingLink.target === 'object'
                ? String(existingLink.target.id)
                : String(existingLink.target);
            return (
              (existingSource === sourceId && existingTarget === targetId) ||
              (existingSource === targetId && existingTarget === sourceId)
            );
          });
          if (exists) return;

          this.d3Nodes[sourceIndex].degree++;
          this.d3Nodes[targetIndex].degree++;
          this.d3Links.push(new Link(sourceId, targetId, link.collabStrength * 5));
        });

        if (parentNode) {
          parentNode.isExpanded = true;
          parentNode.expandStatus = addedNodes > 0 ? 'success' : 'empty';
        }

        this.expanding = false;
        if (addedNodes > 0) {
          this.showNotification(
            `Network expanded. Discovered ${addedNodes} new coauthor${addedNodes === 1 ? '' : 's'}.`,
            'success',
          );
        } else {
          this.showNotification('No new coauthors were found for this author.', 'warning');
        }

        if (this.selectedNode) this.selectNode(this.selectedNode.author.scopus_id, true);
        if (this.graphComponent?.graph) {
          this.graphComponent.graph.initNodes();
          this.graphComponent.graph.initLinks();
          this.graphComponent.graph.simulation.alpha(0.3).restart();
          this.graphComponent.onResize();
        }
      },
      error: (error) => {
        this.expanding = false;
        this.expandedNodeIds.delete(id);
        console.error('Error expanding coauthor network', error);
        this.showNotification('Could not expand the network. Please try again later.', 'error');
      },
    });
  }

  downloadDataUrl(dataUrl: string, filename: string): void {
    const a = this.coreDoc.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    this.coreDoc.body.appendChild(a); //Firefox requires link to be in body
    a.click();
    this.coreDoc.body.removeChild(a);
  }

  onDownloadGraph(): void {
    // Encaja el grafo completo (fit-to-content) y captura el <svg> a alta resolucion,
    // para que la imagen salga centrada y con etiquetas legibles (mejora portada del
    // grafo de Relevant Authors).
    this.fitGraphToView(350);
    setTimeout(() => {
      const svgEl = this.downloadEl.nativeElement.querySelector('graph svg') as HTMLElement | null;
      const target = svgEl ?? this.downloadEl.nativeElement;
      htmlToImage.toPng(target, { pixelRatio: 3, backgroundColor: '#ffffff' }).then((dataUrl) => {
        this.downloadDataUrl(dataUrl, `coauthor-graph-${this.author.scopus_id}`);
      });
    }, 450);
  }

  private getSvgAndZoom() {
    if (!this.downloadEl) return null;
    const svgEl = this.downloadEl.nativeElement.querySelector('graph svg');
    if (!svgEl) return null;
    return { svg: d3.select(svgEl), zoom: (svgEl as any).__zoomBehavior, svgEl };
  }

  /** Mide el bounding box real del grafo y ajusta zoom+pan para que entre completo y centrado. */
  private fitGraphToView(durationMs: number): void {
    const data = this.getSvgAndZoom();
    if (!data || !data.zoom) return;
    const container = data.svgEl.querySelector('g.my-border') as SVGGraphicsElement | null;
    if (!container) return;
    const bbox = container.getBBox();
    if (!bbox.width || !bbox.height) return;
    const vw = data.svgEl.clientWidth || 800;
    const vh = data.svgEl.clientHeight || 600;
    const panelWidth = this.selectedNode ? Math.min(vw * 0.45, 384) : 0;
    const effectiveWidth = Math.max(300, vw - panelWidth);
    const scale = Math.min(Math.min(effectiveWidth / bbox.width, vh / bbox.height) * 0.9, 1.5);
    const tx = effectiveWidth / 2 - scale * (bbox.x + bbox.width / 2);
    const ty = vh / 2 - scale * (bbox.y + bbox.height / 2);
    data.svg
      .transition()
      .duration(durationMs)
      .call(data.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  // --- Seleccion de zona: arrastrar un rectangulo sobre el grafo y exportar solo ese recorte ---
  toggleRegionSelect(): void {
    this.selectingRegion = !this.selectingRegion;
    this.regionStart = null;
    this.regionRect = null;
  }

  private regionCoords(e: MouseEvent): { x: number; y: number } {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  onRegionMouseDown(e: MouseEvent): void {
    const p = this.regionCoords(e);
    this.regionStart = p;
    this.regionRect = { x: p.x, y: p.y, w: 0, h: 0 };
  }

  onRegionMouseMove(e: MouseEvent): void {
    if (!this.regionStart) return;
    const p = this.regionCoords(e);
    this.regionRect = {
      x: Math.min(this.regionStart.x, p.x),
      y: Math.min(this.regionStart.y, p.y),
      w: Math.abs(p.x - this.regionStart.x),
      h: Math.abs(p.y - this.regionStart.y),
    };
  }

  onRegionMouseUp(): void {
    if (this.regionRect && this.regionRect.w > 5 && this.regionRect.h > 5) {
      this.exportRegion(this.regionRect);
      this.selectingRegion = false;
    }
    this.regionStart = null;
    this.regionRect = null;
  }

  /** Exporta solo el rectangulo seleccionado (en coords del viewport del grafo) en alta resolucion. */
  private exportRegion(rect: { x: number; y: number; w: number; h: number }): void {
    const svgEl = this.downloadEl.nativeElement.querySelector('graph svg') as HTMLElement | null;
    if (!svgEl) return;
    const PR = 3; // pixelRatio: alta resolucion para que las etiquetas se lean
    htmlToImage.toPng(svgEl, { pixelRatio: PR, backgroundColor: '#ffffff' }).then((dataUrl) => {
      const img = new Image();
      img.onload = () => {
        const canvas = this.coreDoc.createElement('canvas');
        canvas.width = Math.max(1, Math.round(rect.w * PR));
        canvas.height = Math.max(1, Math.round(rect.h * PR));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          rect.x * PR,
          rect.y * PR,
          rect.w * PR,
          rect.h * PR,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        this.downloadDataUrl(canvas.toDataURL('image/png'), `grafo-zona-${this.author.scopus_id}`);
      };
      img.src = dataUrl;
    });
  }

  // --- Controles de zoom ---
  zoomIn(): void {
    const data = this.getSvgAndZoom();
    if (data && data.zoom) {
      data.svg.transition().duration(300).call(data.zoom.scaleBy, 1.3);
    }
  }

  zoomOut(): void {
    const data = this.getSvgAndZoom();
    if (data && data.zoom) {
      data.svg.transition().duration(300).call(data.zoom.scaleBy, 0.7);
    }
  }

  resetZoom(): void {
    this.fitGraphToView(750);
  }
}
