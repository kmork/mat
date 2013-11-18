package controllers

import play.api.mvc._

object Application extends Controller {

  def index = Action {
    Ok(views.html.index())
  }

  def newMap = Action {
    Redirect(routes.Application.getMap(RandomString.createRandomString(16)));
  }

  def getMap(id: String) = Action {
    Ok(views.html.newMap());
  }

}