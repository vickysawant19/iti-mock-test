/* eslint-disable react/prop-types */
import React from "react";
import CosmeticStoreTab from "./CosmeticStoreTab";

export default function AvatarStoreTab({
  stats,
  purchaseCosmetic,
  equipCosmetic,
}) {
  return (
    <div className="animate-fade-in relative z-10">
      <CosmeticStoreTab
        stats={stats}
        purchaseCosmetic={purchaseCosmetic}
        equipCosmetic={equipCosmetic}
      />
    </div>
  );
}
