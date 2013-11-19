name := "mat"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  anorm,
  cache,
  "org.mongodb" %% "casbah" % "2.6.3"
)     

play.Project.playScalaSettings

