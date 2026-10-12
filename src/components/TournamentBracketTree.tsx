import type { ReactNode } from "react";
import type { TournamentDraw, TournamentMatch } from "../types/tournament";

type BracketTreeNode = {
  key: string;
  kind: "MATCH" | "BYE";
  match?: TournamentMatch;
  entry?: TournamentMatch["entryA"] | null;
  entryId?: number;
  destination?: TournamentMatch;
  destinationSlot?: "A" | "B";
  roundNumber: number;
  column: number;
  centerY: number;
  left?: BracketTreeNode;
  right?: BracketTreeNode;
};

type BracketTreeConnection = {
  source: BracketTreeNode;
  target: BracketTreeNode;
};

type Props = {
  draw: TournamentDraw;
  variant: "screen" | "artwork" | "preview";
  getRoundLabel: (roundNumber: number, drawSize: number) => string;
  displayEntry: (entry: TournamentMatch["entryA"] | null | undefined) => string;
  renderMatch: (match: TournamentMatch) => ReactNode;
};

export default function TournamentBracketTree({
  draw,
  variant,
  getRoundLabel,
  displayEntry,
  renderMatch,
}: Props) {
  const matches = draw.matches;

  if (matches.length === 0) return null;

  const isScreen = variant === "screen";
  const isPreview = variant === "preview";

  const cardWidth = isPreview ? 88 : isScreen ? 200 : 250;
  const columnGap = isPreview ? 120 : isScreen ? 390 : 414;
  const leftMargin = isPreview ? 6 : isScreen ? 40 : 0;
  const firstCenterY = isPreview ? 42 : isScreen ? 100 : 115;
  const leafGap = isPreview ? 92 : isScreen ? 300 : 220;

  function entryFor(match: TournamentMatch, slot: "A" | "B") {
    return slot === "A" ? match.entryA : match.entryB;
  }

  function entryIdFor(match: TournamentMatch, slot: "A" | "B") {
    return slot === "A"
      ? (match.entryA?.id ?? match.entryAId)
      : (match.entryB?.id ?? match.entryBId);
  }

  function makeByeNode(
    key: string,
    entry: TournamentMatch["entryA"] | null | undefined,
    entryId: number,
    destination: TournamentMatch,
    destinationSlot: "A" | "B",
  ): BracketTreeNode {
    return {
      key,
      kind: "BYE",
      entry,
      entryId,
      destination,
      destinationSlot,
      roundNumber: Math.max(1, destination.roundNumber - 1),
      column: Math.max(0, destination.roundNumber - 2),
      centerY: 0,
    };
  }

  function buildInputNode(
    target: TournamentMatch,
    slot: "A" | "B",
    path: Set<number>,
  ): BracketTreeNode | undefined {
    const incoming = matches.find(
      (candidate) =>
        candidate.nextMatchId === target.id && candidate.nextSlot === slot,
    );

    if (incoming) {
      if (path.has(incoming.id)) return undefined;

      // A stored BYE match is represented as a visual advancement,
      // not as another playable match card.
      if (incoming.status === "BYE") {
        const entryAId = incoming.entryA?.id ?? incoming.entryAId;
        const entryBId = incoming.entryB?.id ?? incoming.entryBId;
        const entryId = incoming.winnerEntryId ?? entryAId ?? entryBId;

        if (entryId == null) return undefined;

        const entry =
          incoming.winner ??
          (entryAId === entryId ? incoming.entryA : incoming.entryB);

        return makeByeNode(
          `bye-match-${incoming.id}`,
          entry,
          entryId,
          target,
          slot,
        );
      }

      return buildMatchNode(incoming, path);
    }

    // A direct entry in a later-round slot means the entry received a BYE.
    const entryId = entryIdFor(target, slot);

    if (entryId == null) return undefined;

    return makeByeNode(
      `bye-entry-${target.id}-${slot}-${entryId}`,
      entryFor(target, slot),
      entryId,
      target,
      slot,
    );
  }

  function buildMatchNode(
    match: TournamentMatch,
    path: Set<number>,
  ): BracketTreeNode {
    const node: BracketTreeNode = {
      key: `match-${match.id}`,
      kind: "MATCH",
      match,
      roundNumber: match.roundNumber,
      column: Math.max(0, match.roundNumber - 1),
      centerY: 0,
    };

    if (path.has(match.id) || match.roundNumber <= 1) return node;

    const nextPath = new Set(path);
    nextPath.add(match.id);

    node.left = buildInputNode(match, "A", nextPath);
    node.right = buildInputNode(match, "B", nextPath);

    return node;
  }

  // The final is the root of the bracket tree.
  const root = [...matches].sort(
    (a, b) => b.roundNumber - a.roundNumber || a.matchNumber - b.matchNumber,
  )[0];

  const rootNode = buildMatchNode(root, new Set<number>());

  const nodes: BracketTreeNode[] = [];
  const connections: BracketTreeConnection[] = [];
  let leafIndex = 0;

  function positionNode(node: BracketTreeNode): number {
    const isLeaf =
      node.kind === "BYE" ||
      !node.match ||
      node.match.roundNumber <= 1 ||
      (!node.left && !node.right);

    if (isLeaf) {
      node.centerY = firstCenterY + leafIndex * leafGap;
      leafIndex += 1;
      nodes.push(node);
      return node.centerY;
    }

    const childCenters: number[] = [];

    if (node.left) {
      childCenters.push(positionNode(node.left));
      connections.push({ source: node.left, target: node });
    }

    if (node.right) {
      childCenters.push(positionNode(node.right));
      connections.push({ source: node.right, target: node });
    }

    node.centerY =
      childCenters.length === 2
        ? (childCenters[0] + childCenters[1]) / 2
        : (childCenters[0] ?? firstCenterY);

    nodes.push(node);
    return node.centerY;
  }

  positionNode(rootNode);

  const columns = Math.max(0, ...nodes.map((node) => node.column)) + 1;

  const canvasWidth =
    leftMargin * 2 + cardWidth + Math.max(0, columns - 1) * columnGap;

  const canvasHeight = isPreview
    ? Math.max(
        140,
        firstCenterY * 2 + Math.max(0, leafIndex - 1) * leafGap + 36,
      )
    : Math.max(
        isScreen ? 500 : 620,
        firstCenterY * 2 +
          Math.max(0, leafIndex - 1) * leafGap +
          (isScreen ? 180 : 160),
      );

  function connectorPath(connection: BracketTreeConnection) {
    const sourceX =
      leftMargin + connection.source.column * columnGap + cardWidth;
    const targetX = leftMargin + connection.target.column * columnGap;

    const bendX = (sourceX + targetX) / 2;
    const sourceY = connection.source.centerY;
    const targetY = connection.target.centerY;

    return `M ${sourceX} ${sourceY} H ${bendX} V ${targetY} H ${targetX}`;
  }

  return (
    <div
      className={
        isScreen
          ? "max-w-full touch-pan-x overflow-auto overscroll-x-contain rounded-xl border border-[#103f25]/20 bg-[#f1eee5]"
          : isPreview
            ? "overflow-auto"
            : ""
      }
    >
      <div
        style={{
          position: "relative",
          width: canvasWidth,
          minWidth: canvasWidth,
          height: canvasHeight,
          background: isScreen ? "#f1eee5" : "transparent",
        }}
      >
        <svg
          aria-hidden="true"
          width={canvasWidth}
          height={canvasHeight}
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {connections.map((connection) => {
            const path = connectorPath(connection);

            return (
              <g key={`${connection.source.key}-${connection.target.key}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="#103f25"
                  strokeWidth={isPreview ? 1 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </svg>

        {nodes.map((node) => (
          <div
            key={node.key}
            style={{
              position: "absolute",
              left: leftMargin + node.column * columnGap,
              top: node.centerY,
              width: cardWidth,
              transform: "translateY(-50%)",
              zIndex: 1,
            }}
          >
            {node.kind === "BYE" ? (
              isPreview ? (
                <div className="rounded border border-dashed border-[#103f25]/40 bg-[#eaff9a] p-1.5 text-[8px] font-bold text-[#103f25]">
                  <p className="font-black">BYE</p>
                  <p className="break-words">
                    {displayEntry(node.entry) || `Entry #${node.entryId}`}
                  </p>
                  <p className="mt-1 break-words">
                    → M{node.destination?.matchNumber} · {node.destinationSlot}
                  </p>
                </div>
              ) : isScreen ? (
                <article className="overflow-hidden rounded-xl border-2 border-dashed border-[#103f25]/30 bg-[#fffdf5] text-[#153323]">
                  <div className="flex items-center justify-between gap-2 bg-[#eaff9a] px-3 py-2">
                    <span className="text-[10px] font-black uppercase tracking-wide">
                      BYE · {getRoundLabel(node.roundNumber, draw.drawSize)}
                    </span>
                    <span className="text-[10px] font-black">ADVANCE</span>
                  </div>
                  <div className="break-words p-3 text-sm font-bold">
                    {displayEntry(node.entry) || `Entry #${node.entryId}`}
                  </div>
                  <p className="border-t border-[#103f25]/10 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[#55705e]">
                    Advances to{" "}
                    {node.destination
                      ? getRoundLabel(
                          node.destination.roundNumber,
                          draw.drawSize,
                        )
                      : "later round"}{" "}
                    · Match {node.destination?.matchNumber ?? "?"} · Slot{" "}
                    {node.destinationSlot}
                  </p>
                </article>
              ) : (
                <div
                  style={{
                    overflow: "hidden",
                    border: "2px dashed #103f25",
                    borderRadius: 9,
                    background: "#fffdf5",
                    color: "#103f25",
                  }}
                >
                  <div
                    style={{
                      padding: "9px 12px",
                      background: "#dfff28",
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 1,
                    }}
                  >
                    BYE ·{" "}
                    {getRoundLabel(
                      node.roundNumber,
                      draw.drawSize,
                    ).toUpperCase()}
                  </div>
                  <div
                    style={{
                      padding: "13px 12px",
                      fontSize: 14,
                      fontWeight: 900,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {displayEntry(node.entry) || `Entry #${node.entryId}`}
                  </div>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderTop: "1px solid #dce4d8",
                      background: "#f1eee5",
                      textAlign: "center",
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    ADVANCES TO{" "}
                    {node.destination
                      ? getRoundLabel(
                          node.destination.roundNumber,
                          draw.drawSize,
                        ).toUpperCase()
                      : "LATER ROUND"}{" "}
                    · MATCH {node.destination?.matchNumber ?? "?"} · SLOT{" "}
                    {node.destinationSlot}
                  </div>
                </div>
              )
            ) : node.match ? (
              renderMatch(node.match)
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
