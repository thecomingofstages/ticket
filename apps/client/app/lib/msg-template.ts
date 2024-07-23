import { Seat } from "~/hooks/useMyTicket";
import { liff } from "./liff";
import { groupSeatByRound } from "./seat-sort";

export const transferTicketMessage = async ({
  createdAt,
  seats,
  acceptId,
}: {
  createdAt: string;
  seats: Seat[];
  acceptId: string;
}) => {
  const acceptUrl = `${window.location.origin}/me/ticket/accept/${acceptId}`;
  const liffUrl = await liff.permanentLink.createUrlBy(acceptUrl);
  return liff.shareTargetPicker([
    {
      type: "flex",
      altText:
        "คุณได้รับโอนบัตรเข้าชมการแสดงละครเวทีเรื่อง Hansel and Gretel : Home Sweet Home The Musical",
      contents: {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://raw.githubusercontent.com/thecomingofstages/website/staging/app/opengraph-image.png",
          size: "full",
          aspectRatio: "16:9",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "The Coming of Stages",
              size: "xs",
              weight: "regular",
              margin: "none",
              color: "#52525b",
            },
            {
              type: "text",
              text: "Accept Ticket Transfer",
              weight: "bold",
              size: "xl",
              margin: "sm",
            },
            {
              type: "text",
              text: "คุณได้รับโอนบัตรเข้าชมการแสดงละครเวทีเรื่อง Hansel and Gretel : Home Sweet Home The Musical",
              margin: "sm",
              size: "sm",
              wrap: true,
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: groupSeatByRound(seats).map(([round, seats]) => ({
                type: "box",
                layout: "vertical",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: `รอบการแสดง ${round}:00 น.`,
                    color: "#9ca3af",
                    size: "sm",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: `ที่นั่ง ${seats
                      .map((seat) => seat.seat)
                      .join(", ")}`,
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 5,
                  },
                ],
              })),
              margin: "md",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "button",
              style: "primary",
              height: "sm",
              action: {
                type: "uri",
                label: "ตรวจสอบและรับบัตร",
                uri: liffUrl,
              },
            },
            {
              type: "text",
              text: `ทำรายการโอนเมื่อ ${new Date(createdAt).toLocaleString(
                "th-TH"
              )}`,
              size: "xs",
              style: "normal",
              color: "#9ca3af",
              margin: "lg",
              align: "center",
            },
            {
              type: "box",
              layout: "vertical",
              contents: [],
              margin: "sm",
            },
          ],
          flex: 0,
        },
      },
    },
  ]);
};
