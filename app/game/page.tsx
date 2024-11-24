"use client";
import BrickBreaker from "@/components/BrickBreaker";
import Game from "../../components/ShootingGame"; // Game 컴포넌트를 가져옵니다.
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

export default function GamePage() {
  return (
    <section className="p-4">
      <Tabs>
        <TabList className="m-0">
          <Tab>Shooting Game</Tab>
          <Tab>Brick Breaker</Tab>
        </TabList>
        <TabPanel>
          <div>
            {" "}
            <Game />
          </div>
        </TabPanel>
        <TabPanel>
          <div>
            <BrickBreaker />
          </div>
        </TabPanel>
      </Tabs>
    </section>
  );
}
