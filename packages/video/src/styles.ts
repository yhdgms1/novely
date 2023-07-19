import { css } from "@novely/css";

export const container = css({
  position: "absolute",
  zIndex: 3,
  maxWidth: "80vw",
  minWidth: "30vw",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "end",
});

export const video = css({
  maxWidth: "80vw",
  minWidth: "30vw",
  maxHeight: "60vh",
  borderRadius: "13px",
  boxShadow:
    "0 21rem 87rem 0 rgba(42,44,58,.15), 11.737rem 22.074rem 32rem 0 rgba(129,165,238,.1)",
});

export const button = css({
  padding: "0.24em 0.96em",
  marginTop: "0.48em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "7.5px",
  border: "none",
  color: "#ffffff",
  backgroundColor: "#7047EB",
  "&:hover": {
    cursor: "pointer",
    backgroundColor: "#6134E8",
  },
  "&:active": {
    backgroundColor: "#5220E6",
  },
});
